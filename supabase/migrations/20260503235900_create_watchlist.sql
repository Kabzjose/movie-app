CREATE TABLE watchlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  movie_id integer NOT NULL,
  title text NOT NULL,
  poster_path text,
  rating float,
  year integer,
  added_at timestamp DEFAULT now(),
  UNIQUE(user_id, movie_id)
);
