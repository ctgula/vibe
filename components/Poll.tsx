import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PlusCircle, X, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Poll({ roomId, isHost = false }: { roomId: string; isHost?: boolean }) {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState<string[]>([]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        setLoading(true);
        // Fetch all polls for this room
        const { data: pollsData, error: pollsError } = await supabase
          .from("polls")
          .select(`
            *,
            profiles:user_id(name, avatar_url),
            poll_votes(user_id, option_index)
          `)
          .eq("room_id", roomId)
          .order("created_at", { ascending: false });

        if (pollsError) throw pollsError;

        // Get current user to check for votes
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        
        // Track which polls the current user has voted on
        if (userId) {
          const votedPollIds = pollsData
            ? pollsData
                .filter(poll => 
                  poll.poll_votes.some((vote: any) => vote.user_id === userId)
                )
                .map(poll => poll.id)
            : [];
          setVotedPolls(votedPollIds);
        }

        setPolls(pollsData || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching polls:", err);
        setError("Failed to load polls");
        setLoading(false);
      }
    };

    fetchPolls();

    // Set up real-time subscription for new polls
    const pollsSubscription = supabase
      .channel("polls-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "polls",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch the full poll data with relationships
          const { data } = await supabase
            .from("polls")
            .select(`
              *,
              profiles:user_id(name, avatar_url),
              poll_votes(user_id, option_index)
            `)
            .eq("id", payload.new.id)
            .single();
            
          if (data) {
            setPolls(prev => [data, ...prev]);
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for new votes
    const votesSubscription = supabase
      .channel("poll-votes-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poll_votes",
        },
        async (payload) => {
          const pollId = payload.new.poll_id;
          const optionIndex = payload.new.option_index;
          const userId = payload.new.user_id;
          
          // Update the specific poll with the new vote
          setPolls(prevPolls => 
            prevPolls.map(poll => {
              if (poll.id === pollId) {
                return {
                  ...poll,
                  poll_votes: [...poll.poll_votes, {
                    user_id: userId,
                    option_index: optionIndex
                  }]
                };
              }
              return poll;
            })
          );
          
          // Check if current user voted
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user?.id === userId) {
            setVotedPolls(prev => [...prev, pollId]);
          }
        }
      )
      .subscribe();

    return () => {
      pollsSubscription.unsubscribe();
      votesSubscription.unsubscribe();
    };
  }, [roomId]);

  const createPoll = async () => {
    try {
      // Validate inputs
      if (!newQuestion.trim()) {
        setError("Please enter a question");
        return;
      }
      
      // Filter out empty options
      const filteredOptions = newOptions.filter(opt => opt.trim());
      if (filteredOptions.length < 2) {
        setError("Please provide at least two options");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("You must be logged in to create a poll");
        return;
      }

      setError(null);
      const { data, error: insertError } = await supabase
        .from("polls")
        .insert({
          room_id: roomId,
          user_id: userData.user.id,
          question: newQuestion.trim(),
          options: filteredOptions,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Reset form
      setNewQuestion("");
      setNewOptions(["", ""]);
      setShowPollForm(false);
    } catch (err) {
      console.error("Error creating poll:", err);
      setError("Failed to create poll");
    }
  };

  const vote = async (pollId: string, optionIndex: number) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("You must be logged in to vote");
        return;
      }

      setError(null);
      const { error: voteError } = await supabase.from("poll_votes").insert({
        poll_id: pollId,
        user_id: userData.user.id,
        option_index: optionIndex,
      });

      if (voteError) {
        if (voteError.code === '23505') { // Unique constraint violation
          setError("You've already voted in this poll");
        } else {
          throw voteError;
        }
      } else {
        // Optimistically update UI
        setVotedPolls(prev => [...prev, pollId]);
      }
    } catch (err) {
      console.error("Error voting:", err);
      setError("Failed to submit vote");
    }
  };

  const addOption = () => {
    setNewOptions([...newOptions, ""]);
  };

  const removeOption = (index: number) => {
    if (newOptions.length <= 2) {
      setError("A poll needs at least two options");
      return;
    }
    setError(null);
    const updated = [...newOptions];
    updated.splice(index, 1);
    setNewOptions(updated);
  };

  const getVoteCount = (poll: any, optionIndex: number) => {
    return poll.poll_votes.filter((v: any) => v.option_index === optionIndex).length;
  };

  const getTotalVotes = (poll: any) => {
    return poll.poll_votes.length;
  };

  const getVotePercentage = (poll: any, optionIndex: number) => {
    const total = getTotalVotes(poll);
    if (total === 0) return 0;
    const count = getVoteCount(poll, optionIndex);
    return Math.round((count / total) * 100);
  };

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Polls
        </h3>
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Polls
        </h3>
        
        {isHost && (
          <button
            onClick={() => setShowPollForm(!showPollForm)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
          >
            {showPollForm ? (
              <>
                <X className="w-3 h-3" />
                Cancel
              </>
            ) : (
              <>
                <PlusCircle className="w-3 h-3" />
                Create Poll
              </>
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/20 border border-red-500/30 text-red-200 px-3 py-2 rounded-md mb-3 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Poll Form */}
      <AnimatePresence>
        {showPollForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="space-y-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50 mb-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-zinc-300 mb-1">
                  Question
                </label>
                <input
                  id="question"
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="What would you like to ask?"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Options
                </label>
                <div className="space-y-2">
                  {newOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newOptions];
                          updated[idx] = e.target.value;
                          setNewOptions(updated);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => removeOption(idx)}
                        className="text-zinc-400 hover:text-zinc-200 p-2"
                        aria-label="Remove option"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={addOption}
                  className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  Add Option
                </button>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={createPoll}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-colors"
                >
                  Create Poll
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Polls List */}
      {polls.length === 0 ? (
        <p className="text-zinc-400 text-center py-6">No polls have been created in this room yet.</p>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <div key={poll.id} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700/50">
              <div className="mb-3">
                <h4 className="text-white font-medium text-lg">{poll.question}</h4>
                <p className="text-zinc-400 text-xs">
                  Created by {poll.profiles?.name || 'Unknown'} • {getTotalVotes(poll)} votes
                </p>
              </div>
              
              <div className="space-y-2">
                {poll.options.map((opt: string, idx: number) => {
                  const hasVoted = votedPolls.includes(poll.id);
                  const voteCount = getVoteCount(poll, idx);
                  const votePercentage = getVotePercentage(poll, idx);
                  
                  return (
                    <div key={idx} className="relative">
                      {hasVoted ? (
                        <div className="flex items-center">
                          <div className="w-full bg-zinc-800 rounded-md h-10 overflow-hidden">
                            <div 
                              className="bg-indigo-600/30 h-full flex items-center px-3"
                              style={{ width: `${votePercentage}%` }}
                            >
                              <span className="text-white text-sm font-medium">{opt}</span>
                            </div>
                          </div>
                          <span className="ml-2 text-zinc-300 text-sm font-medium whitespace-nowrap">
                            {votePercentage}% ({voteCount})
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => vote(poll.id, idx)}
                          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-left px-3 py-2 rounded-md transition-colors"
                        >
                          {opt}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
