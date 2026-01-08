import { ethers } from "ethers";

// ABI Minimal para as funções de busca
const abi = [
    "function getScores() public view returns (tuple(address player, string name, uint256 score)[])",
    "function getAllScores() public view returns (tuple(string name, uint256 score)[])",
    "function scoreCount() public view returns (uint256)",
    "function scores(uint256 index) public view returns (string name, uint256 score)"
];

const contractAddress = "0x9b673bDBA9ed06989b1846d4C63468BCE86cf006";

export const fetchOnChainLeaderboard = async () => {
    try {
        const publicRpcUrl = "https://rpc.testnet.arc.network";
        const provider = new ethers.JsonRpcProvider(publicRpcUrl);
        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        console.log('🔍 Leaderboard: Buscando dados no contrato:', contractAddress);
        
        let rawScores: any[] = [];
        
        // 1. Tentar getScores() que parece retornar [address, name, score] conforme ArcScan
        try {
            console.log("📡 Tentando getScores()...");
            const res = await contract.getScores();
            if (res && Array.isArray(res)) {
                rawScores = res;
                console.log("✅ getScores() retornou:", res.length, "itens");
            }
        } catch (e) {
            console.warn("⚠️ getScores() falhou");
            
            // 2. Fallback para getAllScores()
            try {
                console.log("📡 Tentando getAllScores()...");
                const res = await contract.getAllScores();
                if (res && Array.isArray(res)) {
                    rawScores = res;
                    console.log("✅ getAllScores() retornou:", res.length, "itens");
                }
            } catch (e2) {
                console.warn("⚠️ getAllScores() falhou");
                
                // 3. Fallback para mapping manual
                try {
                    console.log("📡 Tentando mapping manual...");
                    const count = await contract.scoreCount();
                    const total = Math.min(Number(count), 50);
                    for (let i = 0; i < total; i++) {
                        const s = await contract.scores(i);
                        if (s && s[0]) rawScores.push(s);
                    }
                } catch (e3) {}
            }
        }

        // Normalização baseada no ArcScan (onde aparece address, name, score)
        const normalized = rawScores.map(s => {
            let name = "Anonymous";
            let scoreValue = 0;

            if (Array.isArray(s)) {
                if (s.length >= 3) {
                    // [address, name, score]
                    name = s[1] ? s[1].toString() : "Anonymous";
                    scoreValue = Number(s[2]);
                } else {
                    // [name, score]
                    name = s[0] ? s[0].toString() : "Anonymous";
                    scoreValue = Number(s[1]);
                }
            } else if (s && typeof s === 'object') {
                name = (s.name || s[0] || "Anonymous").toString();
                scoreValue = Number(s.score || s[1] || 0);
            }

            return { playerName: name.trim() || "Anonymous", score: scoreValue };
        }).filter(s => s.score > 0);

        console.log("📊 Dados normalizados para o leaderboard:", normalized);

        // Remover duplicados e ordenar
        const unique = normalized.reduce((acc: any[], curr) => {
            const exists = acc.find(x => x.playerName === curr.playerName && x.score === curr.score);
            if (!exists) acc.push(curr);
            return acc;
        }, []);

        // Fetch local scores for missing data
        try {
            const localResponse = await fetch("/api/leaderboard");
            if (localResponse.ok) {
                const localScores = await localResponse.json();
                return unique.sort((a, b) => b.score - a.score).map(s => {
                    const localMatch = localScores.find((ls: any) => ls.playerName === s.playerName && Math.floor(ls.score) === Math.floor(s.score));
                    return {
                        ...s,
                        wave: localMatch?.wave || 1,
                        enemiesDefeated: localMatch?.enemiesDefeated || 0,
                        playTime: localMatch?.playTime || 0
                    };
                });
            }
        } catch (e) {}

        return unique.sort((a, b) => b.score - a.score).map(s => ({
            ...s,
            enemiesDefeated: 0,
            wave: 1,
            playTime: 0
        }));

    } catch (e) {
        console.error('❌ Erro no Leaderboard:', e);
        return [];
    }
};
