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
        // 1. Tentar buscar no Supabase (Backend) primeiro, pois é mais confiável e rápido
        let localScores: any[] = [];
        try {
            console.log("📡 Buscando scores do backend...");
            const localResponse = await fetch("/api/leaderboard");
            if (localResponse.ok) {
                localScores = await localResponse.json();
                console.log("✅ Dados do backend carregados:", localScores.length, "itens");
            } else {
                console.error("❌ Erro na resposta do backend:", localResponse.status);
            }
        } catch (e) {
            console.error("❌ Erro ao buscar scores do backend:", e);
        }

        const publicRpcUrl = "https://rpc.testnet.arc.network";
        const provider = new ethers.JsonRpcProvider(publicRpcUrl);
        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        console.log('🔍 Leaderboard: Buscando dados no contrato:', contractAddress);
        
        let rawScores: any[] = [];
        
        // 2. Tentar buscar dados On-Chain como complemento/validação
        try {
            console.log("📡 Tentando getScores()...");
            const res = await contract.getScores();
            if (res && Array.isArray(res)) {
                rawScores = res;
            }
        } catch (e) {
            try {
                const res = await contract.getAllScores();
                if (res && Array.isArray(res)) rawScores = res;
            } catch (e2) {
                try {
                    const count = await contract.scoreCount();
                    const total = Math.min(Number(count), 50);
                    for (let i = 0; i < total; i++) {
                        const s = await contract.scores(i);
                        if (s && s[0]) rawScores.push(s);
                    }
                } catch (e3) {}
            }
        }

        // Normalização dos dados On-Chain
        const normalizedOnChain = rawScores.map(s => {
            let name = "Anonymous";
            let scoreValue = 0;
            if (Array.isArray(s)) {
                if (s.length >= 3) {
                    name = s[1] ? s[1].toString() : "Anonymous";
                    scoreValue = Number(s[2]);
                } else {
                    name = s[0] ? s[0].toString() : "Anonymous";
                    scoreValue = Number(s[1]);
                }
            } else if (s && typeof s === 'object') {
                name = (s.name || s[0] || "Anonymous").toString();
                scoreValue = Number(s.score || s[1] || 0);
            }
            return { playerName: name.trim() || "Anonymous", score: scoreValue, onChain: true };
        }).filter(s => s.score > 0);

        // Mesclar dados: Prioridade para o que está no backend, mas adiciona o que for novo da Blockchain
        const combined = [...localScores];
        
        normalizedOnChain.forEach(onChainScore => {
            const exists = combined.find(ls => 
                ls.playerName === onChainScore.playerName
            );
            if (!exists) {
                combined.push({
                    playerName: onChainScore.playerName,
                    score: onChainScore.score,
                    wave: 1,
                    enemiesDefeated: 0,
                    playTime: 0
                });
            } else if (onChainScore.score > exists.score) {
                // Atualiza se o score da blockchain for maior
                exists.score = onChainScore.score;
            }
        });

        console.log("📊 Leaderboard Combinado:", combined.length, "itens");
        return combined.sort((a, b) => b.score - a.score);
    } catch (e) {
        console.error('❌ Erro no Leaderboard:', e);
        return [];
    }
};
