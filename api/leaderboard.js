import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Robust field normalizer - accepts multiple property name variations
 * and returns a standardized value
 */
function normalizeField(record, fieldVariations, defaultValue = 0) {
  for (const field of fieldVariations) {
    const value = record[field]
    if (value !== undefined && value !== null) {
      return value
    }
  }
  return defaultValue
}

/**
 * Normalize a single score record to standard format
 */
function normalizeScoreRecord(record) {
  // Player Name variations
  const playerName = normalizeField(record, [
    'playerName',
    'player_name',
    'player',
    'Player',
    'PLAYER'
  ], 'Anonymous')

  // Enemies Defeated variations
  const enemiesDefeated = normalizeField(record, [
    'enemiesDefeated',
    'enemies_defeated',
    'enemies',
    'Enemies',
    'ENEMIES'
  ], 0)

  // Play Time variations
  const playTime = normalizeField(record, [
    'playTime',
    'play_time',
    'time',
    'Time',
    'TIME'
  ], 0)

  // Score variations
  const score = normalizeField(record, [
    'score',
    'Score',
    'SCORE'
  ], 0)

  // Wave variations
  const wave = normalizeField(record, [
    'wave',
    'Wave',
    'WAVE'
  ], 0)

  return {
    id: record.id,
    playerName,
    score,
    wave,
    enemiesDefeated,
    playTime,
    createdAt: record.created_at || record.createdAt
  }
}

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

  // Normalize all records to standardized format
  const formattedData = data.map(normalizeScoreRecord)

  return res.status(200).json(formattedData)
}
