import { supabase } from '../lib/supabaseClient.js';

/**
 * Fetches matching profiles for a project using the get_project_matches RPC.
 * Returns verified users whose skills overlap with the project's skills_needed,
 * ordered by match score (number of overlapping skills).
 *
 * @param {string} projectId - UUID of the project
 * @returns {Promise<Array>} Array of matched profiles with match_score
 */
export async function fetchMatchesForProject(projectId) {
  try {
    const { data, error } = await supabase.rpc('get_project_matches', {
      p_project_id: projectId,
    });

    if (error) {
      console.error('Error fetching project matches:', error);
      throw error;
    }

    return data ?? [];
  } catch (err) {
    console.error('fetchMatchesForProject failed:', err);
    throw err;
  }
}
