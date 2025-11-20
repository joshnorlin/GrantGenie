--
-- PostgreSQL database dump
--

-- \restrict MGFwZY7B5XBut2WWdkODkN4CkcNEkxoyEwhAWFcnAFDpHeZNwszBYWnnQdc4bSX

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


--
-- Name: EXTENSION "pg_graphql"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "pg_graphql" IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_stat_statements"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "pg_stat_statements" IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: EXTENSION "supabase_vault"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "supabase_vault" IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: add_creator_to_grant_memberships(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."add_creator_to_grant_memberships"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert the creator as a member of the grant
  INSERT INTO public.grant_memberships (grant_id, user_id, role, status)
  VALUES (
    NEW.grant_id,
    NEW.created_by,
    'admin',      -- or 'creator', whatever role you prefer
    'active'      -- status can default to 'pending', but we can set 'active' immediately
  )
  ON CONFLICT (grant_id, user_id) DO NOTHING;  -- prevent duplicates if somehow trigger fires twice

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_creator_to_grant_memberships"() OWNER TO "postgres";

--
-- Name: get_budget_summary(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_budget_summary"("p_grant_id" integer) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select jsonb_agg(
    jsonb_build_object(
      'category_id', gbi.category_id,
      'category', cl.category,
      'budgeted', gbi.amount,
      'spent', coalesce(t.total_spent, 0)
    )
  )
  from grant_budget_items gbi
  join category_lookup cl on cl.category_id = gbi.category_id
  left join (
    select category_id, sum(amount) as total_spent
    from transactions
    where grant_id = p_grant_id
    group by category_id
  ) t on t.category_id = gbi.category_id
  where gbi.grant_id = p_grant_id;
$$;


ALTER FUNCTION "public"."get_budget_summary"("p_grant_id" integer) OWNER TO "postgres";

--
-- Name: is_admin_for_grant(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_admin_for_grant"("grant_id" integer) RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from grant_memberships
    where user_id = auth.uid()
      and role = 'admin'
      and grant_memberships.grant_id = grant_id
  );
$$;


ALTER FUNCTION "public"."is_admin_for_grant"("grant_id" integer) OWNER TO "postgres";

--
-- Name: is_grant_member(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_grant_member"("grant_id" integer) RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM grant_memberships
    WHERE user_id = auth.uid()
      AND grant_memberships.grant_id = is_grant_member.grant_id
  );
$$;


ALTER FUNCTION "public"."is_grant_member"("grant_id" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: category_lookup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."category_lookup" (
    "category_id" integer NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."category_lookup" OWNER TO "postgres";

--
-- Name: category_lookup_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "public"."category_lookup_category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."category_lookup_category_id_seq" OWNER TO "postgres";

--
-- Name: category_lookup_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "public"."category_lookup_category_id_seq" OWNED BY "public"."category_lookup"."category_id";


--
-- Name: grant_budget_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."grant_budget_items" (
    "grant_budget_item_id" integer NOT NULL,
    "grant_id" integer,
    "amount" numeric(12,2) NOT NULL,
    "entered_by" "uuid",
    "category_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grant_budget_items" OWNER TO "postgres";

--
-- Name: grant_budget_items_grant_budget_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "public"."grant_budget_items_grant_budget_item_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."grant_budget_items_grant_budget_item_id_seq" OWNER TO "postgres";

--
-- Name: grant_budget_items_grant_budget_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "public"."grant_budget_items_grant_budget_item_id_seq" OWNED BY "public"."grant_budget_items"."grant_budget_item_id";


--
-- Name: grant_memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."grant_memberships" (
    "grant_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "invited_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grant_memberships" OWNER TO "postgres";

--
-- Name: grants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."grants" (
    "grant_id" integer NOT NULL,
    "grant_number" "text",
    "name" "text" NOT NULL,
    "parent_grant_id" integer,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grants" OWNER TO "postgres";

--
-- Name: grants_grant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "public"."grants_grant_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."grants_grant_id_seq" OWNER TO "postgres";

--
-- Name: grants_grant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "public"."grants_grant_id_seq" OWNED BY "public"."grants"."grant_id";


--
-- Name: institutional_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."institutional_rules" (
    "rule_id" integer NOT NULL,
    "ruleset" "jsonb" NOT NULL,
    "grant_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."institutional_rules" OWNER TO "postgres";

--
-- Name: institutional_rules_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "public"."institutional_rules_rule_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."institutional_rules_rule_id_seq" OWNER TO "postgres";

--
-- Name: institutional_rules_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "public"."institutional_rules_rule_id_seq" OWNED BY "public"."institutional_rules"."rule_id";


--
-- Name: llm_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."llm_logs" (
    "log_id" integer NOT NULL,
    "transaction_id" integer,
    "log" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "confidence_score" numeric(5,2),
    "redo_of_transaction_id" integer
);


ALTER TABLE "public"."llm_logs" OWNER TO "postgres";

--
-- Name: llm_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "public"."llm_logs_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."llm_logs_log_id_seq" OWNER TO "postgres";

--
-- Name: llm_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "public"."llm_logs_log_id_seq" OWNED BY "public"."llm_logs"."log_id";


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "transaction_id" integer NOT NULL,
    "grant_budget_item_id" integer,
    "grant_id" integer,
    "amount" numeric(12,2) NOT NULL,
    "entered_by" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "category_id" integer,
    "additional_details" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "redo_of_transaction_id" integer,
    "confidence_score" numeric(5,2),
    "verified_by" "uuid",
    "human_verified" boolean DEFAULT false
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";

--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS "public"."transactions_transaction_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."transactions_transaction_id_seq" OWNER TO "postgres";

--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "public"."transactions_transaction_id_seq" OWNED BY "public"."transactions"."transaction_id";


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."users" (
    "uid" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "added_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";

--
-- Name: category_lookup category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."category_lookup" ALTER COLUMN "category_id" SET DEFAULT "nextval"('"public"."category_lookup_category_id_seq"'::"regclass");


--
-- Name: grant_budget_items grant_budget_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grant_budget_items" ALTER COLUMN "grant_budget_item_id" SET DEFAULT "nextval"('"public"."grant_budget_items_grant_budget_item_id_seq"'::"regclass");


--
-- Name: grants grant_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grants" ALTER COLUMN "grant_id" SET DEFAULT "nextval"('"public"."grants_grant_id_seq"'::"regclass");


--
-- Name: institutional_rules rule_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."institutional_rules" ALTER COLUMN "rule_id" SET DEFAULT "nextval"('"public"."institutional_rules_rule_id_seq"'::"regclass");


--
-- Name: llm_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."llm_logs" ALTER COLUMN "log_id" SET DEFAULT "nextval"('"public"."llm_logs_log_id_seq"'::"regclass");


--
-- Name: transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."transactions" ALTER COLUMN "transaction_id" SET DEFAULT "nextval"('"public"."transactions_transaction_id_seq"'::"regclass");


--
-- Name: category_lookup category_lookup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."category_lookup"
    ADD CONSTRAINT "category_lookup_pkey" PRIMARY KEY ("category_id");


--
-- Name: grant_budget_items grant_budget_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grant_budget_items"
    ADD CONSTRAINT "grant_budget_items_pkey" PRIMARY KEY ("grant_budget_item_id");


--
-- Name: grant_memberships grant_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grant_memberships"
    ADD CONSTRAINT "grant_memberships_pkey" PRIMARY KEY ("grant_id", "user_id");


--
-- Name: grants grants_nsf_grant_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grants"
    ADD CONSTRAINT "grants_nsf_grant_number_key" UNIQUE ("grant_number");


--
-- Name: grants grants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grants"
    ADD CONSTRAINT "grants_pkey" PRIMARY KEY ("grant_id");


--
-- Name: institutional_rules institutional_rules_grant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."institutional_rules"
    ADD CONSTRAINT "institutional_rules_grant_id_key" UNIQUE ("grant_id");


--
-- Name: institutional_rules institutional_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."institutional_rules"
    ADD CONSTRAINT "institutional_rules_pkey" PRIMARY KEY ("rule_id");


--
-- Name: llm_logs llm_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."llm_logs"
    ADD CONSTRAINT "llm_logs_pkey" PRIMARY KEY ("log_id");


--
-- Name: llm_logs llm_logs_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."llm_logs"
    ADD CONSTRAINT "llm_logs_transaction_id_key" UNIQUE ("transaction_id");


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("uid");


--
-- Name: idx_grant_budget_items_grant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_grant_budget_items_grant" ON "public"."grant_budget_items" USING "btree" ("grant_id");


--
-- Name: idx_grant_memberships_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_grant_memberships_user" ON "public"."grant_memberships" USING "btree" ("user_id", "grant_id");


--
-- Name: idx_llm_logs_transaction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_llm_logs_transaction_id" ON "public"."llm_logs" USING "btree" ("transaction_id");


--
-- Name: idx_transactions_grant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_transactions_grant" ON "public"."transactions" USING "btree" ("grant_id");


--
-- Name: idx_transactions_grant_category_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_transactions_grant_category_status" ON "public"."transactions" USING "btree" ("grant_id", "category_id", "status");


--
-- Name: idx_transactions_redo_of; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_transactions_redo_of" ON "public"."transactions" USING "btree" ("redo_of_transaction_id");


--
-- Name: idx_transactions_verified_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_transactions_verified_by" ON "public"."transactions" USING "btree" ("verified_by");


--
-- Name: grants on_grant_created; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "on_grant_created" AFTER INSERT ON "public"."grants" FOR EACH ROW EXECUTE FUNCTION "public"."add_creator_to_grant_memberships"();


--
-- Name: grant_budget_items grant_budget_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grant_budget_items"
    ADD CONSTRAINT "grant_budget_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category_lookup"("category_id") ON DELETE SET NULL;


--
-- Name: grant_budget_items grant_budget_items_entered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grant_budget_items"
    ADD CONSTRAINT "grant_budget_items_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("uid") ON DELETE SET NULL;


--
-- Name: grant_budget_items grant_budget_items_grant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grant_budget_items"
    ADD CONSTRAINT "grant_budget_items_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "public"."grants"("grant_id") ON DELETE CASCADE;


--
-- Name: grant_memberships grant_memberships_grant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grant_memberships"
    ADD CONSTRAINT "grant_memberships_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "public"."grants"("grant_id") ON DELETE CASCADE;


--
-- Name: grant_memberships grant_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grant_memberships"
    ADD CONSTRAINT "grant_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE CASCADE;


--
-- Name: grants grants_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grants"
    ADD CONSTRAINT "grants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("uid") ON DELETE SET NULL;


--
-- Name: grants grants_parent_grant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."grants"
    ADD CONSTRAINT "grants_parent_grant_id_fkey" FOREIGN KEY ("parent_grant_id") REFERENCES "public"."grants"("grant_id") ON DELETE SET NULL;


--
-- Name: institutional_rules institutional_rules_grant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."institutional_rules"
    ADD CONSTRAINT "institutional_rules_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "public"."grants"("grant_id") ON DELETE CASCADE;


--
-- Name: llm_logs llm_logs_redo_of_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."llm_logs"
    ADD CONSTRAINT "llm_logs_redo_of_transaction_id_fkey" FOREIGN KEY ("redo_of_transaction_id") REFERENCES "public"."transactions"("transaction_id") ON DELETE SET NULL;


--
-- Name: llm_logs llm_logs_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."llm_logs"
    ADD CONSTRAINT "llm_logs_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("transaction_id") ON DELETE CASCADE;


--
-- Name: transactions transactions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category_lookup"("category_id") ON DELETE SET NULL;


--
-- Name: transactions transactions_entered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("uid") ON DELETE SET NULL;


--
-- Name: transactions transactions_grant_budget_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_grant_budget_item_id_fkey" FOREIGN KEY ("grant_budget_item_id") REFERENCES "public"."grant_budget_items"("grant_budget_item_id") ON DELETE CASCADE;


--
-- Name: transactions transactions_grant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "public"."grants"("grant_id") ON DELETE CASCADE;


--
-- Name: transactions transactions_redo_of_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_redo_of_transaction_id_fkey" FOREIGN KEY ("redo_of_transaction_id") REFERENCES "public"."transactions"("transaction_id") ON DELETE SET NULL;


--
-- Name: transactions transactions_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("uid") ON DELETE SET NULL;


--
-- Name: users users_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("uid") ON DELETE SET NULL;


--
-- Name: users users_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_uid_fkey" FOREIGN KEY ("uid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: category_lookup; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."category_lookup" ENABLE ROW LEVEL SECURITY;

--
-- Name: category_lookup category_lookup_delete_service; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "category_lookup_delete_service" ON "public"."category_lookup" FOR DELETE USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));


--
-- Name: category_lookup category_lookup_insert_service; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "category_lookup_insert_service" ON "public"."category_lookup" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));


--
-- Name: category_lookup category_lookup_select_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "category_lookup_select_all" ON "public"."category_lookup" FOR SELECT USING (true);


--
-- Name: category_lookup category_lookup_update_service; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "category_lookup_update_service" ON "public"."category_lookup" FOR UPDATE USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));


--
-- Name: grant_budget_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."grant_budget_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: grant_budget_items grant_budget_items_delete_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "grant_budget_items_delete_member" ON "public"."grant_budget_items" FOR DELETE USING (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: grant_budget_items grant_budget_items_insert_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "grant_budget_items_insert_member" ON "public"."grant_budget_items" FOR INSERT WITH CHECK ((("public"."is_grant_member"("grant_id") AND ("entered_by" = ( SELECT "auth"."uid"() AS "uid"))) OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: grant_budget_items grant_budget_items_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "grant_budget_items_select_member" ON "public"."grant_budget_items" FOR SELECT USING (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: grant_budget_items grant_budget_items_update_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "grant_budget_items_update_member" ON "public"."grant_budget_items" FOR UPDATE USING (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text"))) WITH CHECK (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: grant_memberships; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."grant_memberships" ENABLE ROW LEVEL SECURITY;

--
-- Name: grant_memberships grant_memberships_delete_self_or_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "grant_memberships_delete_self_or_admin" ON "public"."grant_memberships" FOR DELETE USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: grant_memberships grant_memberships_insert_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "grant_memberships_insert_admin" ON "public"."grant_memberships" FOR INSERT WITH CHECK (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: grant_memberships grant_memberships_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "grant_memberships_select_member" ON "public"."grant_memberships" FOR SELECT USING (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: grant_memberships grant_memberships_update_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "grant_memberships_update_admin" ON "public"."grant_memberships" FOR UPDATE USING (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text"))) WITH CHECK (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: grants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."grants" ENABLE ROW LEVEL SECURITY;

--
-- Name: grants grants_delete_creator_or_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "grants_delete_creator_or_admin" ON "public"."grants" FOR DELETE USING ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id")));


--
-- Name: grants grants_insert_authenticated; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "grants_insert_authenticated" ON "public"."grants" FOR INSERT WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: grants grants_select_member_or_creator_or_service; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "grants_select_member_or_creator_or_service" ON "public"."grants" FOR SELECT USING ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: grants grants_update_creator_or_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "grants_update_creator_or_admin" ON "public"."grants" FOR UPDATE USING ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id"))) WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id")));


--
-- Name: institutional_rules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."institutional_rules" ENABLE ROW LEVEL SECURITY;

--
-- Name: institutional_rules institutional_rules_delete_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "institutional_rules_delete_admin" ON "public"."institutional_rules" FOR DELETE USING (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: institutional_rules institutional_rules_insert_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "institutional_rules_insert_admin" ON "public"."institutional_rules" FOR INSERT WITH CHECK (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: institutional_rules institutional_rules_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "institutional_rules_select_member" ON "public"."institutional_rules" FOR SELECT USING (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: institutional_rules institutional_rules_update_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "institutional_rules_update_admin" ON "public"."institutional_rules" FOR UPDATE USING (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text"))) WITH CHECK (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: llm_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."llm_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: llm_logs llm_logs_manage_service; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "llm_logs_manage_service" ON "public"."llm_logs" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));


--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions transactions_delete_owner_or_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "transactions_delete_owner_or_admin" ON "public"."transactions" FOR DELETE USING ((("entered_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: transactions transactions_insert_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "transactions_insert_member" ON "public"."transactions" FOR INSERT WITH CHECK ((("public"."is_grant_member"("grant_id") AND ("entered_by" = ( SELECT "auth"."uid"() AS "uid"))) OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: transactions transactions_insert_redo_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "transactions_insert_redo_member" ON "public"."transactions" FOR INSERT WITH CHECK (("public"."is_grant_member"("grant_id") AND ("entered_by" = "auth"."uid"())));


--
-- Name: transactions transactions_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "transactions_select_member" ON "public"."transactions" FOR SELECT USING (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: transactions transactions_update_owner_or_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "transactions_update_owner_or_admin" ON "public"."transactions" FOR UPDATE USING ((("entered_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text"))) WITH CHECK ((("entered_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));


--
-- Name: transactions transactions_update_verification_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "transactions_update_verification_admin" ON "public"."transactions" FOR UPDATE USING (("public"."is_admin_for_grant"("grant_id") OR ( SELECT ("auth"."role"() = 'service_role'::"text")))) WITH CHECK (true);


--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

--
-- Name: users users_delete_service; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users_delete_service" ON "public"."users" FOR DELETE USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));


--
-- Name: users users_insert_service; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users_insert_service" ON "public"."users" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));


--
-- Name: users users_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users_select" ON "public"."users" FOR SELECT TO "anon" USING (("uid" = ( SELECT "auth"."uid"() AS "uid")));


--
-- Name: users users_update_service; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users_update_service" ON "public"."users" FOR UPDATE USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));


--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

-- CREATE PUBLICATION "supabase_realtime" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

--
-- Name: supabase_realtime grant_budget_items; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grant_budget_items";


--
-- Name: supabase_realtime grant_memberships; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grant_memberships";


--
-- Name: supabase_realtime users; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "armor"("bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."armor"("bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "armor"("bytea", "text"[], "text"[]); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "dashboard_user";


--
-- Name: FUNCTION "crypt"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."crypt"("text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "dearmor"("text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."dearmor"("text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."digest"("bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."digest"("text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_bytes"(integer); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_uuid"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."gen_random_uuid"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."gen_salt"("text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text", integer); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."gen_salt"("text", integer) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) TO "dashboard_user";


--
-- Name: FUNCTION "pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_key_id"("bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v1"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1mc"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v3"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v4"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v4"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v5"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_nil"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_nil"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_dns"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_ns_dns"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_oid"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_ns_oid"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_url"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_ns_url"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_x500"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_ns_x500"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "dashboard_user";


--
-- Name: FUNCTION "graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb"); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "postgres";
-- GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "anon";
-- GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "authenticated";
-- GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "service_role";


--
-- Name: FUNCTION "add_creator_to_grant_memberships"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."add_creator_to_grant_memberships"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_creator_to_grant_memberships"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_creator_to_grant_memberships"() TO "service_role";


--
-- Name: FUNCTION "get_budget_summary"("p_grant_id" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_budget_summary"("p_grant_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_budget_summary"("p_grant_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_budget_summary"("p_grant_id" integer) TO "service_role";


--
-- Name: FUNCTION "is_admin_for_grant"("grant_id" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_admin_for_grant"("grant_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_for_grant"("grant_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_for_grant"("grant_id" integer) TO "service_role";


--
-- Name: FUNCTION "is_grant_member"("grant_id" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_grant_member"("grant_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."is_grant_member"("grant_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_grant_member"("grant_id" integer) TO "service_role";


--
-- Name: FUNCTION "_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea"); Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "service_role";


--
-- Name: FUNCTION "create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: TABLE "pg_stat_statements"; Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON TABLE "extensions"."pg_stat_statements" FROM "postgres";
-- GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "dashboard_user";


--
-- Name: TABLE "pg_stat_statements_info"; Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON TABLE "extensions"."pg_stat_statements_info" FROM "postgres";
-- GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "dashboard_user";


--
-- Name: TABLE "category_lookup"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."category_lookup" TO "anon";
GRANT ALL ON TABLE "public"."category_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."category_lookup" TO "service_role";


--
-- Name: SEQUENCE "category_lookup_category_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."category_lookup_category_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."category_lookup_category_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."category_lookup_category_id_seq" TO "service_role";


--
-- Name: TABLE "grant_budget_items"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."grant_budget_items" TO "anon";
GRANT ALL ON TABLE "public"."grant_budget_items" TO "authenticated";
GRANT ALL ON TABLE "public"."grant_budget_items" TO "service_role";


--
-- Name: SEQUENCE "grant_budget_items_grant_budget_item_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."grant_budget_items_grant_budget_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."grant_budget_items_grant_budget_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."grant_budget_items_grant_budget_item_id_seq" TO "service_role";


--
-- Name: TABLE "grant_memberships"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."grant_memberships" TO "anon";
GRANT ALL ON TABLE "public"."grant_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."grant_memberships" TO "service_role";


--
-- Name: TABLE "grants"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."grants" TO "anon";
GRANT ALL ON TABLE "public"."grants" TO "authenticated";
GRANT ALL ON TABLE "public"."grants" TO "service_role";


--
-- Name: SEQUENCE "grants_grant_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."grants_grant_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."grants_grant_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."grants_grant_id_seq" TO "service_role";


--
-- Name: TABLE "institutional_rules"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."institutional_rules" TO "anon";
GRANT ALL ON TABLE "public"."institutional_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."institutional_rules" TO "service_role";


--
-- Name: SEQUENCE "institutional_rules_rule_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."institutional_rules_rule_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."institutional_rules_rule_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."institutional_rules_rule_id_seq" TO "service_role";


--
-- Name: TABLE "llm_logs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."llm_logs" TO "anon";
GRANT ALL ON TABLE "public"."llm_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."llm_logs" TO "service_role";


--
-- Name: SEQUENCE "llm_logs_log_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."llm_logs_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."llm_logs_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."llm_logs_log_id_seq" TO "service_role";


--
-- Name: TABLE "transactions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";


--
-- Name: SEQUENCE "transactions_transaction_id_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."transactions_transaction_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transactions_transaction_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transactions_transaction_id_seq" TO "service_role";


--
-- Name: TABLE "users"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";


--
-- Name: TABLE "secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."secrets" TO "postgres" WITH GRANT OPTION;
-- GRANT SELECT,DELETE ON TABLE "vault"."secrets" TO "service_role";


--
-- Name: TABLE "decrypted_secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."decrypted_secrets" TO "postgres" WITH GRANT OPTION;
-- GRANT SELECT,DELETE ON TABLE "vault"."decrypted_secrets" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_graphql_placeholder" ON "sql_drop"
--          WHEN TAG IN ('DROP EXTENSION')
--    EXECUTE FUNCTION "extensions"."set_graphql_placeholder"();


-- ALTER EVENT TRIGGER "issue_graphql_placeholder" OWNER TO "supabase_admin";

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_pg_cron_access" ON "ddl_command_end"
--          WHEN TAG IN ('CREATE EXTENSION')
--    EXECUTE FUNCTION "extensions"."grant_pg_cron_access"();


-- ALTER EVENT TRIGGER "issue_pg_cron_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_pg_graphql_access" ON "ddl_command_end"
--          WHEN TAG IN ('CREATE FUNCTION')
--    EXECUTE FUNCTION "extensions"."grant_pg_graphql_access"();


-- ALTER EVENT TRIGGER "issue_pg_graphql_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_pg_net_access" ON "ddl_command_end"
--          WHEN TAG IN ('CREATE EXTENSION')
--    EXECUTE FUNCTION "extensions"."grant_pg_net_access"();


-- ALTER EVENT TRIGGER "issue_pg_net_access" OWNER TO "supabase_admin";

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "pgrst_ddl_watch" ON "ddl_command_end"
--    EXECUTE FUNCTION "extensions"."pgrst_ddl_watch"();


-- ALTER EVENT TRIGGER "pgrst_ddl_watch" OWNER TO "supabase_admin";

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "pgrst_drop_watch" ON "sql_drop"
--    EXECUTE FUNCTION "extensions"."pgrst_drop_watch"();


-- ALTER EVENT TRIGGER "pgrst_drop_watch" OWNER TO "supabase_admin";

--
-- PostgreSQL database dump complete
--

-- \unrestrict MGFwZY7B5XBut2WWdkODkN4CkcNEkxoyEwhAWFcnAFDpHeZNwszBYWnnQdc4bSX

