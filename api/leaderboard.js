import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .order('score', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // 🔥 AQUI está a correção real
  const mapped = data.map(row => ({
    id: row.id,
    playerName: row.player_name,
    score: row.score,
    wave: row.wave,
    enemiesDefeated: row.enemies_defeated,
    playTime: row.play_time,
    createdAt: row.created_at
  }))

  return res.status(200).json(mapped)
}
