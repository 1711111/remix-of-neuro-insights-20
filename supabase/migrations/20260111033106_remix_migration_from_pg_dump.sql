CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'teacher',
    'student',
    'admin'
);


--
-- Name: award_leaderboard_prizes(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.award_leaderboard_prizes(_timeframe text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  current_start date;
  period_start date;
  inserted_id uuid;
  r record;
  winners_json jsonb := '[]'::jsonb;
  prize int;
  idx int := 0;
BEGIN
  PERFORM set_config('row_security', 'off', true);

  IF _timeframe = 'daily' THEN
    current_start := date_trunc('day', now())::date;
    period_start := (current_start - interval '1 day')::date;
  ELSIF _timeframe = 'weekly' THEN
    current_start := date_trunc('week', now())::date;
    period_start := (current_start - interval '7 days')::date;
  ELSIF _timeframe = 'monthly' THEN
    current_start := date_trunc('month', now())::date;
    period_start := (current_start - interval '1 month')::date;
  ELSE
    RAISE EXCEPTION 'Invalid timeframe: %', _timeframe;
  END IF;

  INSERT INTO public.leaderboard_awards (timeframe, period_start, winners)
  VALUES (_timeframe, period_start, '[]'::jsonb)
  ON CONFLICT (timeframe, period_start) DO NOTHING
  RETURNING id INTO inserted_id;

  IF inserted_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_awarded',
      'timeframe', _timeframe,
      'period_start', period_start
    );
  END IF;

  FOR r IN
    SELECT da.user_id, COALESCE(SUM(da.points_earned), 0)::int AS period_points
    FROM public.daily_activity da
    WHERE da.activity_date >= period_start
      AND da.activity_date < current_start
    GROUP BY da.user_id
    ORDER BY period_points DESC, da.user_id
    LIMIT 3
  LOOP
    idx := idx + 1;

    prize := CASE _timeframe
      WHEN 'daily' THEN CASE idx WHEN 1 THEN 100 WHEN 2 THEN 50 ELSE 25 END
      WHEN 'weekly' THEN CASE idx WHEN 1 THEN 500 WHEN 2 THEN 300 ELSE 250 END
      WHEN 'monthly' THEN CASE idx WHEN 1 THEN 2000 WHEN 2 THEN 1000 ELSE 500 END
    END;

    -- Add points to winner
    UPDATE public.user_stats
      SET total_points = total_points + prize,
          updated_at = now()
    WHERE user_id = r.user_id;

    winners_json := winners_json || jsonb_build_object(
      'rank', idx,
      'user_id', r.user_id,
      'period_points', r.period_points,
      'prize', prize
    );
  END LOOP;

  UPDATE public.leaderboard_awards
    SET winners = winners_json,
        awarded_at = now()
  WHERE id = inserted_id;

  RETURN jsonb_build_object(
    'status', 'awarded',
    'timeframe', _timeframe,
    'period_start', period_start,
    'winners', winners_json
  );
END;
$$;


--
-- Name: delete_empty_team(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_empty_team() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- If member_count is 0, delete the team
  IF NEW.member_count <= 0 THEN
    DELETE FROM public.teams WHERE id = NEW.id;
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: get_leaderboard(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_leaderboard(_timeframe text) RETURNS TABLE(user_id uuid, display_name text, points integer, quests_completed integer, current_streak integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Return leaderboard based on current available points (total_points minus spent)
  -- The _timeframe parameter is kept for API compatibility but we now show current balance
  RETURN QUERY
  SELECT
    p.id AS user_id,
    COALESCE(p.display_name, 'Eco Warrior')::text AS display_name,
    GREATEST(0, COALESCE(us.total_points, 0) - COALESCE(spent.spent_points, 0))::int AS points,
    COALESCE(us.quests_completed, 0)::int AS quests_completed,
    COALESCE(us.current_streak, 0)::int AS current_streak
  FROM public.profiles p
  LEFT JOIN public.user_stats us ON us.user_id = p.id
  LEFT JOIN (
    SELECT 
      ur.user_id,
      COALESCE(SUM(r.points_cost), 0)::int AS spent_points
    FROM public.user_rewards ur
    JOIN public.rewards r ON r.id = ur.reward_id
    GROUP BY ur.user_id
  ) spent ON spent.user_id = p.id
  WHERE COALESCE(us.total_points, 0) > 0
  ORDER BY GREATEST(0, COALESCE(us.total_points, 0) - COALESCE(spent.spent_points, 0)) DESC,
           COALESCE(us.quests_completed, 0) DESC,
           p.created_at ASC
  LIMIT 10;
END;
$$;


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;


--
-- Name: get_user_school_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_school_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT school_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;


--
-- Name: get_user_team_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_team_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT team_id FROM public.team_memberships WHERE user_id = _user_id LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'display_name', 'User'));
  RETURN new;
END;
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
  )
$$;


--
-- Name: is_moderator(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_moderator(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = 'teacher'::app_role OR role = 'admin'::app_role)
  )
$$;


--
-- Name: is_team_member(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_team_member(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_memberships WHERE user_id = _user_id
  )
$$;


--
-- Name: update_team_member_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_team_member_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.teams SET member_count = member_count + 1 WHERE id = NEW.team_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.teams SET member_count = member_count - 1 WHERE id = OLD.team_id;
    RETURN OLD;
  END IF;
END;
$$;


--
-- Name: update_team_points(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_team_points() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Update team total points when a member earns points
  UPDATE public.teams 
  SET total_points = total_points + NEW.points_earned,
      updated_at = now()
  WHERE id = NEW.team_id AND NEW.team_id IS NOT NULL;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_level(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_level() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_xp integer;
  new_level integer;
  xp_needed integer;
  level_titles text[] := ARRAY['Eco Beginner', 'Green Sprout', 'Nature Friend', 'Earth Defender', 'Eco Warrior', 'Planet Protector', 'Nature Guardian', 'Climate Champion', 'Eco Master', 'Earth Legend'];
BEGIN
  -- Calculate total XP from points (1 point = 1 XP)
  new_xp := NEW.total_points;
  
  -- Calculate level based on XP thresholds
  -- Level 1: 0-99, Level 2: 100-249, Level 3: 250-499, etc.
  IF new_xp < 100 THEN
    new_level := 1;
    xp_needed := 100;
  ELSIF new_xp < 250 THEN
    new_level := 2;
    xp_needed := 250;
  ELSIF new_xp < 500 THEN
    new_level := 3;
    xp_needed := 500;
  ELSIF new_xp < 1000 THEN
    new_level := 4;
    xp_needed := 1000;
  ELSIF new_xp < 2000 THEN
    new_level := 5;
    xp_needed := 2000;
  ELSIF new_xp < 3500 THEN
    new_level := 6;
    xp_needed := 3500;
  ELSIF new_xp < 5500 THEN
    new_level := 7;
    xp_needed := 5500;
  ELSIF new_xp < 8000 THEN
    new_level := 8;
    xp_needed := 8000;
  ELSIF new_xp < 12000 THEN
    new_level := 9;
    xp_needed := 12000;
  ELSE
    new_level := 10;
    xp_needed := 12000;
  END IF;

  -- Update user_levels table
  INSERT INTO public.user_levels (user_id, level, current_xp, xp_to_next_level, title, updated_at)
  VALUES (
    NEW.user_id, 
    new_level, 
    new_xp, 
    xp_needed, 
    level_titles[new_level],
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    level = new_level,
    current_xp = new_xp,
    xp_to_next_level = xp_needed,
    title = level_titles[new_level],
    updated_at = now();

  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: ai_quest_generations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_quest_generations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    generation_date date DEFAULT CURRENT_DATE NOT NULL,
    count integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text DEFAULT 'leaf'::text NOT NULL,
    tier text DEFAULT 'bronze'::text NOT NULL,
    category text NOT NULL,
    requirement_type text NOT NULL,
    requirement_value integer DEFAULT 1 NOT NULL,
    points_reward integer DEFAULT 50 NOT NULL,
    is_rare boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: challenge_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenge_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    challenge_id uuid NOT NULL,
    user_id uuid NOT NULL,
    team_id uuid,
    points_earned integer NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    challenge_type text NOT NULL,
    points integer NOT NULL,
    bonus_multiplier numeric(3,2) DEFAULT 1.5 NOT NULL,
    verification_hint text,
    difficulty text DEFAULT 'medium'::text NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])))
);


--
-- Name: completed_quests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.completed_quests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    quest_title text NOT NULL,
    quest_category text NOT NULL,
    points_earned integer NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    activity_date date NOT NULL,
    quests_completed integer DEFAULT 0 NOT NULL,
    challenges_completed integer DEFAULT 0 NOT NULL,
    points_earned integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: forum_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forum_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    author_name text DEFAULT 'Anonymous'::text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid
);


--
-- Name: forum_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forum_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_name text DEFAULT 'Anonymous'::text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    likes integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid
);


--
-- Name: impact_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.impact_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    co2_saved_kg numeric(10,2) DEFAULT 0 NOT NULL,
    plastic_avoided_kg numeric(10,2) DEFAULT 0 NOT NULL,
    water_saved_liters numeric(10,2) DEFAULT 0 NOT NULL,
    trees_equivalent numeric(10,2) DEFAULT 0 NOT NULL,
    energy_saved_kwh numeric(10,2) DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leaderboard_awards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leaderboard_awards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    timeframe text NOT NULL,
    period_start date NOT NULL,
    awarded_at timestamp with time zone DEFAULT now() NOT NULL,
    winners jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT leaderboard_awards_timeframe_check CHECK ((timeframe = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    points_cost integer NOT NULL,
    category text NOT NULL,
    partner_name text,
    image_url text,
    stock integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: survey_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.survey_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    feedback text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT survey_responses_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: team_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT team_memberships_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text])))
);


--
-- Name: team_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    user_name text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: team_shop_vote_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_shop_vote_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vote_id uuid NOT NULL,
    user_id uuid NOT NULL,
    vote_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT team_shop_vote_entries_vote_type_check CHECK ((vote_type = ANY (ARRAY['for'::text, 'against'::text])))
);


--
-- Name: team_shop_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_shop_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    item_id text NOT NULL,
    item_name text NOT NULL,
    item_cost integer NOT NULL,
    initiated_by uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL,
    CONSTRAINT team_shop_votes_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    avatar_url text,
    created_by uuid NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    member_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_active_quests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_active_quests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    points integer NOT NULL,
    category text NOT NULL,
    verification_hint text,
    difficulty text NOT NULL,
    is_ai_generated boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_team_quest boolean DEFAULT false NOT NULL,
    team_id uuid
);


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    earned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    current_xp integer DEFAULT 0 NOT NULL,
    xp_to_next_level integer DEFAULT 100 NOT NULL,
    title text DEFAULT 'Eco Beginner'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reward_id uuid NOT NULL,
    redeemed_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    redemption_code text
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    school_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    current_streak integer DEFAULT 0 NOT NULL,
    longest_streak integer DEFAULT 0 NOT NULL,
    quests_completed integer DEFAULT 0 NOT NULL,
    last_quest_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    quests_since_last_survey integer DEFAULT 0,
    team_id uuid
);


--
-- Name: ai_quest_generations ai_quest_generations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_quest_generations
    ADD CONSTRAINT ai_quest_generations_pkey PRIMARY KEY (id);


--
-- Name: ai_quest_generations ai_quest_generations_user_id_generation_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_quest_generations
    ADD CONSTRAINT ai_quest_generations_user_id_generation_date_key UNIQUE (user_id, generation_date);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: challenge_completions challenge_completions_challenge_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_completions
    ADD CONSTRAINT challenge_completions_challenge_id_user_id_key UNIQUE (challenge_id, user_id);


--
-- Name: challenge_completions challenge_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_completions
    ADD CONSTRAINT challenge_completions_pkey PRIMARY KEY (id);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- Name: completed_quests completed_quests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.completed_quests
    ADD CONSTRAINT completed_quests_pkey PRIMARY KEY (id);


--
-- Name: daily_activity daily_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activity
    ADD CONSTRAINT daily_activity_pkey PRIMARY KEY (id);


--
-- Name: daily_activity daily_activity_user_id_activity_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activity
    ADD CONSTRAINT daily_activity_user_id_activity_date_key UNIQUE (user_id, activity_date);


--
-- Name: forum_comments forum_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_comments
    ADD CONSTRAINT forum_comments_pkey PRIMARY KEY (id);


--
-- Name: forum_posts forum_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT forum_posts_pkey PRIMARY KEY (id);


--
-- Name: impact_stats impact_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impact_stats
    ADD CONSTRAINT impact_stats_pkey PRIMARY KEY (id);


--
-- Name: impact_stats impact_stats_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impact_stats
    ADD CONSTRAINT impact_stats_user_id_key UNIQUE (user_id);


--
-- Name: leaderboard_awards leaderboard_awards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_awards
    ADD CONSTRAINT leaderboard_awards_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: rewards rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);


--
-- Name: schools schools_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_name_key UNIQUE (name);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: survey_responses survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_pkey PRIMARY KEY (id);


--
-- Name: team_memberships team_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_memberships
    ADD CONSTRAINT team_memberships_pkey PRIMARY KEY (id);


--
-- Name: team_memberships team_memberships_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_memberships
    ADD CONSTRAINT team_memberships_user_id_key UNIQUE (user_id);


--
-- Name: team_messages team_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_messages
    ADD CONSTRAINT team_messages_pkey PRIMARY KEY (id);


--
-- Name: team_shop_vote_entries team_shop_vote_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_shop_vote_entries
    ADD CONSTRAINT team_shop_vote_entries_pkey PRIMARY KEY (id);


--
-- Name: team_shop_vote_entries team_shop_vote_entries_vote_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_shop_vote_entries
    ADD CONSTRAINT team_shop_vote_entries_vote_id_user_id_key UNIQUE (vote_id, user_id);


--
-- Name: team_shop_vote_entries team_shop_vote_entries_vote_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_shop_vote_entries
    ADD CONSTRAINT team_shop_vote_entries_vote_user_unique UNIQUE (vote_id, user_id);


--
-- Name: team_shop_votes team_shop_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_shop_votes
    ADD CONSTRAINT team_shop_votes_pkey PRIMARY KEY (id);


--
-- Name: teams teams_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_name_key UNIQUE (name);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: user_active_quests user_active_quests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_active_quests
    ADD CONSTRAINT user_active_quests_pkey PRIMARY KEY (id);


--
-- Name: user_active_quests user_active_quests_user_id_title_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_active_quests
    ADD CONSTRAINT user_active_quests_user_id_title_key UNIQUE (user_id, title);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_user_id_badge_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);


--
-- Name: user_levels user_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_levels
    ADD CONSTRAINT user_levels_pkey PRIMARY KEY (id);


--
-- Name: user_levels user_levels_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_levels
    ADD CONSTRAINT user_levels_user_id_key UNIQUE (user_id);


--
-- Name: user_rewards user_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards
    ADD CONSTRAINT user_rewards_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);


--
-- Name: user_stats user_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_pkey PRIMARY KEY (id);


--
-- Name: user_stats user_stats_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_user_id_key UNIQUE (user_id);


--
-- Name: idx_team_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_messages_created_at ON public.team_messages USING btree (created_at DESC);


--
-- Name: idx_team_messages_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_messages_team_id ON public.team_messages USING btree (team_id);


--
-- Name: leaderboard_awards_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX leaderboard_awards_unique ON public.leaderboard_awards USING btree (timeframe, period_start);


--
-- Name: challenge_completions on_challenge_completion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_challenge_completion AFTER INSERT ON public.challenge_completions FOR EACH ROW EXECUTE FUNCTION public.update_team_points();


--
-- Name: team_memberships on_team_membership_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_team_membership_change AFTER INSERT OR DELETE ON public.team_memberships FOR EACH ROW EXECUTE FUNCTION public.update_team_member_count();


--
-- Name: user_stats sync_user_level; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_user_level AFTER INSERT OR UPDATE OF total_points ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.update_user_level();


--
-- Name: teams trigger_delete_empty_team; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_delete_empty_team AFTER UPDATE OF member_count ON public.teams FOR EACH ROW WHEN ((new.member_count <= 0)) EXECUTE FUNCTION public.delete_empty_team();


--
-- Name: forum_posts update_forum_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: impact_stats update_impact_stats_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_impact_stats_updated_at BEFORE UPDATE ON public.impact_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_levels update_user_levels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_levels_updated_at BEFORE UPDATE ON public.user_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_stats update_user_stats_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: challenge_completions challenge_completions_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_completions
    ADD CONSTRAINT challenge_completions_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;


--
-- Name: challenge_completions challenge_completions_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_completions
    ADD CONSTRAINT challenge_completions_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: forum_comments forum_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_comments
    ADD CONSTRAINT forum_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE;


--
-- Name: forum_comments forum_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_comments
    ADD CONSTRAINT forum_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: forum_posts forum_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT forum_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: survey_responses survey_responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: team_memberships team_memberships_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_memberships
    ADD CONSTRAINT team_memberships_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_messages team_messages_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_messages
    ADD CONSTRAINT team_messages_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_shop_vote_entries team_shop_vote_entries_vote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_shop_vote_entries
    ADD CONSTRAINT team_shop_vote_entries_vote_id_fkey FOREIGN KEY (vote_id) REFERENCES public.team_shop_votes(id) ON DELETE CASCADE;


--
-- Name: team_shop_votes team_shop_votes_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_shop_votes
    ADD CONSTRAINT team_shop_votes_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: user_active_quests user_active_quests_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_active_quests
    ADD CONSTRAINT user_active_quests_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;


--
-- Name: user_rewards user_rewards_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards
    ADD CONSTRAINT user_rewards_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_stats user_stats_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: rewards Anyone can view active rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active rewards" ON public.rewards FOR SELECT USING ((is_active = true));


--
-- Name: badges Anyone can view badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);


--
-- Name: forum_comments Authenticated users can create comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create comments" ON public.forum_comments FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (auth.uid() = user_id)));


--
-- Name: forum_posts Authenticated users can create posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create posts" ON public.forum_posts FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (auth.uid() = user_id)));


--
-- Name: teams Authenticated users can create teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create teams" ON public.teams FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (auth.uid() = created_by)));


--
-- Name: team_memberships Authenticated users can join teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can join teams" ON public.team_memberships FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (auth.uid() = user_id)));


--
-- Name: challenges Authenticated users can view active challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active challenges" ON public.challenges FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: team_memberships Authenticated users can view all memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view all memberships" ON public.team_memberships FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: teams Authenticated users can view all teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view all teams" ON public.teams FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: forum_comments Authenticated users can view comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view comments" ON public.forum_comments FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: challenge_completions Authenticated users can view completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view completions" ON public.challenge_completions FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: leaderboard_awards Authenticated users can view leaderboard awards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view leaderboard awards" ON public.leaderboard_awards FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: forum_posts Authenticated users can view posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view posts" ON public.forum_posts FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: profiles Authenticated users can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: forum_comments Authors can delete their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can delete their own comments" ON public.forum_comments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: forum_posts Authors can delete their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can delete their own posts" ON public.forum_posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: forum_comments Authors can update their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can update their own comments" ON public.forum_comments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: forum_posts Authors can update their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors can update their own posts" ON public.forum_posts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: forum_comments Moderators can delete any comment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can delete any comment" ON public.forum_comments FOR DELETE USING (public.is_moderator(auth.uid()));


--
-- Name: forum_posts Moderators can delete any post; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can delete any post" ON public.forum_posts FOR DELETE USING (public.is_moderator(auth.uid()));


--
-- Name: teams Moderators can delete any team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can delete any team" ON public.teams FOR DELETE USING (public.is_moderator(auth.uid()));


--
-- Name: challenges Moderators can delete challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can delete challenges" ON public.challenges FOR DELETE USING (public.is_moderator(auth.uid()));


--
-- Name: challenges Moderators can insert challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can insert challenges" ON public.challenges FOR INSERT WITH CHECK (public.is_moderator(auth.uid()));


--
-- Name: badges Moderators can manage badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can manage badges" ON public.badges USING (public.is_moderator(auth.uid()));


--
-- Name: rewards Moderators can manage rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can manage rewards" ON public.rewards USING (public.is_moderator(auth.uid()));


--
-- Name: challenges Moderators can update challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Moderators can update challenges" ON public.challenges FOR UPDATE USING (public.is_moderator(auth.uid()));


--
-- Name: schools Schools are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Schools are viewable by everyone" ON public.schools FOR SELECT USING (true);


--
-- Name: completed_quests Teachers can view student quests from their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view student quests from their school" ON public.completed_quests FOR SELECT USING (((auth.uid() = user_id) OR ((public.get_user_role(auth.uid()) = 'teacher'::public.app_role) AND (public.get_user_school_id(auth.uid()) = public.get_user_school_id(user_id)))));


--
-- Name: user_stats Teachers can view student stats from their school; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view student stats from their school" ON public.user_stats FOR SELECT USING (((auth.uid() = user_id) OR ((public.get_user_role(auth.uid()) = 'teacher'::public.app_role) AND (public.get_user_school_id(auth.uid()) = public.get_user_school_id(user_id)))));


--
-- Name: team_shop_votes Team members can create shop votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can create shop votes" ON public.team_shop_votes FOR INSERT WITH CHECK (((auth.uid() = initiated_by) AND (EXISTS ( SELECT 1
   FROM public.team_memberships
  WHERE ((team_memberships.team_id = team_shop_votes.team_id) AND (team_memberships.user_id = auth.uid()))))));


--
-- Name: team_messages Team members can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can send messages" ON public.team_messages FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.team_memberships
  WHERE ((team_memberships.team_id = team_messages.team_id) AND (team_memberships.user_id = auth.uid()))))));


--
-- Name: team_shop_votes Team members can update shop votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can update shop votes" ON public.team_shop_votes FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.team_memberships
  WHERE ((team_memberships.team_id = team_shop_votes.team_id) AND (team_memberships.user_id = auth.uid())))));


--
-- Name: team_shop_votes Team members can view shop votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can view shop votes" ON public.team_shop_votes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.team_memberships
  WHERE ((team_memberships.team_id = team_shop_votes.team_id) AND (team_memberships.user_id = auth.uid())))));


--
-- Name: team_messages Team members can view team messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can view team messages" ON public.team_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.team_memberships
  WHERE ((team_memberships.team_id = team_messages.team_id) AND (team_memberships.user_id = auth.uid())))));


--
-- Name: team_shop_vote_entries Team members can view vote entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can view vote entries" ON public.team_shop_vote_entries FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.team_shop_votes
     JOIN public.team_memberships ON ((team_memberships.team_id = team_shop_votes.team_id)))
  WHERE ((team_shop_votes.id = team_shop_vote_entries.vote_id) AND (team_memberships.user_id = auth.uid())))));


--
-- Name: teams Team owners can delete their team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can delete their team" ON public.teams FOR DELETE USING ((auth.uid() = created_by));


--
-- Name: teams Team owners can update their team; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team owners can update their team" ON public.teams FOR UPDATE USING ((auth.uid() = created_by));


--
-- Name: team_shop_vote_entries Users can add their vote; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add their vote" ON public.team_shop_vote_entries FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM (public.team_shop_votes
     JOIN public.team_memberships ON ((team_memberships.team_id = team_shop_votes.team_id)))
  WHERE ((team_shop_votes.id = team_shop_vote_entries.vote_id) AND (team_memberships.user_id = auth.uid()))))));


--
-- Name: user_active_quests Users can delete their own active quests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own active quests" ON public.user_active_quests FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: team_messages Users can delete their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own messages" ON public.team_messages FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_badges Users can earn badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can earn badges" ON public.user_badges FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: daily_activity Users can insert own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own activity" ON public.daily_activity FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: impact_stats Users can insert own impact; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own impact" ON public.impact_stats FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_levels Users can insert own level; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own level" ON public.user_levels FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: user_active_quests Users can insert their own active quests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own active quests" ON public.user_active_quests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: completed_quests Users can insert their own completed quests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own completed quests" ON public.completed_quests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: challenge_completions Users can insert their own completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own completions" ON public.challenge_completions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ai_quest_generations Users can insert their own generations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own generations" ON public.ai_quest_generations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_roles Users can insert their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own role" ON public.user_roles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_stats Users can insert their own stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own stats" ON public.user_stats FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: survey_responses Users can insert their own surveys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own surveys" ON public.survey_responses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: team_memberships Users can leave teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can leave teams" ON public.team_memberships FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_rewards Users can redeem rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can redeem rewards" ON public.user_rewards FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: daily_activity Users can update own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own activity" ON public.daily_activity FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: impact_stats Users can update own impact; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own impact" ON public.impact_stats FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_levels Users can update own level; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own level" ON public.user_levels FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: ai_quest_generations Users can update their own generations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own generations" ON public.ai_quest_generations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_stats Users can update their own stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own stats" ON public.user_stats FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_badges Users can view all earned badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all earned badges" ON public.user_badges FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: user_levels Users can view all levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all levels" ON public.user_levels FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: daily_activity Users can view own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own activity" ON public.daily_activity FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: impact_stats Users can view own impact; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own impact" ON public.impact_stats FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_rewards Users can view own rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own rewards" ON public.user_rewards FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_active_quests Users can view their own active quests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own active quests" ON public.user_active_quests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_quest_generations Users can view their own generations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own generations" ON public.ai_quest_generations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: survey_responses Users can view their own surveys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own surveys" ON public.survey_responses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_quest_generations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_quest_generations ENABLE ROW LEVEL SECURITY;

--
-- Name: badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

--
-- Name: challenge_completions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;

--
-- Name: challenges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: completed_quests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.completed_quests ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: forum_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: forum_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: impact_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.impact_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: leaderboard_awards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leaderboard_awards ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: schools; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

--
-- Name: survey_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: team_memberships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

--
-- Name: team_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: team_shop_vote_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_shop_vote_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: team_shop_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_shop_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

--
-- Name: user_active_quests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_active_quests ENABLE ROW LEVEL SECURITY;

--
-- Name: user_badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: user_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

--
-- Name: user_rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;