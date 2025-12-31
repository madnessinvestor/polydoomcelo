import { ethers } from "ethers";

// ABI com variações de assinaturas e mapeamento individual
const abi = [
    "function getAllScores() public view returns (tuple(string name, uint256 score)[])",
    "function getScores() public view returns (tuple(string name, uint256 score)[])",
    "function getTopScores(uint256 limit) public view returns (tuple(string name, uint256 score)[])",
    "function scoreCount() public view returns (uint256)",
    "function totalScores() public view returns (uint256)",
    "function scores(uint256 index) public view returns (string name, uint256 score)",
    "function leaderboard(uint256 index) public view returns (string name, uint256 score)",
    "function getPlayerScore(address player) public view returns (string name, uint256 score)",
    "function userScores(address user) public view returns (uint256)",
    "function getScores() public view returns (tuple(address player, string name, uint256 score)[])"
];

const contractAddress = "0x9b673bDBA9ed06989b1846d4C63468BCE86cf006";

export const fetchOnChainLeaderboard = async () => {
    try {
        const publicRpcUrl = "https://rpc.testnet.arc.network";
        const provider = new ethers.JsonRpcProvider(publicRpcUrl);
        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        console.log('🔍 Leaderboard: Buscando no contrato:', contractAddress);
        
        let onChainScores: any[] = [];
        
        // 1. Tentar métodos de lista exaustivamente
        const listMethods = [
            { name: 'getAllScores', args: [] },
            { name: 'getScores', args: [] },
            { name: 'getTopScores', args: [100] }
        ];

        for (const m of listMethods) {
            try {
                const res = await (contract as any)[m.name](...m.args);
                if (res && Array.isArray(res) && res.length > 0) {
                    onChainScores = res;
                    console.log(`✅ Leaderboard: Sucesso via ${m.name}, total: ${res.length}`);
                    break;
                }
            } catch (e) {
                // Tentar sem argumentos se for erro de assinatura
            }
        }

        // 2. Se lista falhou, tentar ler os primeiros 10 do mapping como "brute force"
        if (onChainScores.length === 0) {
            console.log('📡 Leaderboard: Tentando mapping individual...');
            for (let i = 0; i < 10; i++) {
                try {
                    let data;
                    try {
                        data = await contract.scores(i);
                    } catch (e) {
                        data = await contract.leaderboard(i);
                    }

                    if (data && (data[0] !== "" || Number(data[1]) > 0)) {
                        onChainScores.push({ name: data[0], score: data[1] });
                    }
                } catch (e) {
                    break;
                }
            }
        }

        // 3. Score pessoal via MetaMask
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
                const accounts = await browserProvider.listAccounts();
                if (accounts.length > 0) {
                    const addr = accounts[0].address;
                    try {
                        const s = await contract.getPlayerScore(addr);
                        if (s && Number(s[1]) > 0) {
                            onChainScores.push({ name: s[0] || "You", score: s[1] });
                        }
                    } catch (e) {
                        try {
                            const val = await contract.userScores(addr);
                            if (Number(val) > 0) onChainScores.push({ name: "Your Highscore", score: val });
                        } catch (e2) {}
                    }
                }
            } catch (e) {}
        }

        // 4. Normalização Robusta
        const normalized = onChainScores.map(s => {
            let name = "Anonymous";
            let score = 0;

            if (Array.isArray(s)) {
                if (s.length >= 3) {
                    name = s[1] ? s[1].toString() : "Anonymous";
                    score = Number(s[2]);
                } else {
                    name = s[0] ? s[0].toString() : "Anonymous";
                    score = Number(s[1]);
                }
            } else if (typeof s === 'object' && s !== null) {
                name = (s.name || s.playerName || s[0] || "Anonymous").toString();
                score = Number(s.score || s.highScore || s[1] || 0);
            }

            return { name: name.trim() || "Anonymous", score };
        }).filter(s => s.score > 0);

        // Remover duplicados
        const unique = normalized.reduce((acc: any[], curr) => {
            if (!acc.find(x => x.name === curr.name && x.score === curr.score)) {
                acc.push(curr);
            }
            return acc;
        }, []);

        console.log(`📊 Leaderboard: ${unique.length} scores encontrados.`);
        return unique.sort((a, b) => b.score - a.score).map(s => ({
            playerName: s.name,
            score: s.score,
            enemiesDefeated: 0
        }));
    } catch (e) {
        console.error('❌ Erro no Leaderboard:', e);
        return [];
    }
};
