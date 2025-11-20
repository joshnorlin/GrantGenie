


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






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


CREATE TABLE IF NOT EXISTS "public"."category_lookup" (
    "category_id" integer NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."category_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."category_lookup_category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."category_lookup_category_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."category_lookup_category_id_seq" OWNED BY "public"."category_lookup"."category_id";



CREATE TABLE IF NOT EXISTS "public"."grant_budget_items" (
    "grant_budget_item_id" integer NOT NULL,
    "grant_id" integer,
    "amount" numeric(12,2) NOT NULL,
    "entered_by" "uuid",
    "category_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grant_budget_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."grant_budget_items_grant_budget_item_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."grant_budget_items_grant_budget_item_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."grant_budget_items_grant_budget_item_id_seq" OWNED BY "public"."grant_budget_items"."grant_budget_item_id";



CREATE TABLE IF NOT EXISTS "public"."grant_memberships" (
    "grant_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "invited_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grant_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grants" (
    "grant_id" integer NOT NULL,
    "grant_number" "text",
    "name" "text" NOT NULL,
    "parent_grant_id" integer,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."grants" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."grants_grant_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."grants_grant_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."grants_grant_id_seq" OWNED BY "public"."grants"."grant_id";



CREATE TABLE IF NOT EXISTS "public"."institutional_rules" (
    "rule_id" integer NOT NULL,
    "ruleset" "jsonb" NOT NULL,
    "grant_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."institutional_rules" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."institutional_rules_rule_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."institutional_rules_rule_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."institutional_rules_rule_id_seq" OWNED BY "public"."institutional_rules"."rule_id";



CREATE TABLE IF NOT EXISTS "public"."llm_logs" (
    "log_id" integer NOT NULL,
    "transaction_id" integer,
    "log" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."llm_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."llm_logs_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."llm_logs_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."llm_logs_log_id_seq" OWNED BY "public"."llm_logs"."log_id";



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "transaction_id" integer NOT NULL,
    "grant_budget_item_id" integer,
    "grant_id" integer,
    "amount" numeric(12,2) NOT NULL,
    "entered_by" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "category_id" integer,
    "additional_details" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."transactions_transaction_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."transactions_transaction_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."transactions_transaction_id_seq" OWNED BY "public"."transactions"."transaction_id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "uid" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "added_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."category_lookup" ALTER COLUMN "category_id" SET DEFAULT "nextval"('"public"."category_lookup_category_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."grant_budget_items" ALTER COLUMN "grant_budget_item_id" SET DEFAULT "nextval"('"public"."grant_budget_items_grant_budget_item_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."grants" ALTER COLUMN "grant_id" SET DEFAULT "nextval"('"public"."grants_grant_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."institutional_rules" ALTER COLUMN "rule_id" SET DEFAULT "nextval"('"public"."institutional_rules_rule_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."llm_logs" ALTER COLUMN "log_id" SET DEFAULT "nextval"('"public"."llm_logs_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."transactions" ALTER COLUMN "transaction_id" SET DEFAULT "nextval"('"public"."transactions_transaction_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."category_lookup"
    ADD CONSTRAINT "category_lookup_pkey" PRIMARY KEY ("category_id");



ALTER TABLE ONLY "public"."grant_budget_items"
    ADD CONSTRAINT "grant_budget_items_pkey" PRIMARY KEY ("grant_budget_item_id");



ALTER TABLE ONLY "public"."grant_memberships"
    ADD CONSTRAINT "grant_memberships_pkey" PRIMARY KEY ("grant_id", "user_id");



ALTER TABLE ONLY "public"."grants"
    ADD CONSTRAINT "grants_nsf_grant_number_key" UNIQUE ("grant_number");



ALTER TABLE ONLY "public"."grants"
    ADD CONSTRAINT "grants_pkey" PRIMARY KEY ("grant_id");



ALTER TABLE ONLY "public"."institutional_rules"
    ADD CONSTRAINT "institutional_rules_grant_id_key" UNIQUE ("grant_id");



ALTER TABLE ONLY "public"."institutional_rules"
    ADD CONSTRAINT "institutional_rules_pkey" PRIMARY KEY ("rule_id");



ALTER TABLE ONLY "public"."llm_logs"
    ADD CONSTRAINT "llm_logs_pkey" PRIMARY KEY ("log_id");



ALTER TABLE ONLY "public"."llm_logs"
    ADD CONSTRAINT "llm_logs_transaction_id_key" UNIQUE ("transaction_id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("uid");



CREATE INDEX "idx_grant_budget_items_grant" ON "public"."grant_budget_items" USING "btree" ("grant_id");



CREATE INDEX "idx_grant_memberships_user" ON "public"."grant_memberships" USING "btree" ("user_id", "grant_id");



CREATE INDEX "idx_llm_logs_transaction_id" ON "public"."llm_logs" USING "btree" ("transaction_id");



CREATE INDEX "idx_transactions_grant" ON "public"."transactions" USING "btree" ("grant_id");



CREATE OR REPLACE TRIGGER "on_grant_created" AFTER INSERT ON "public"."grants" FOR EACH ROW EXECUTE FUNCTION "public"."add_creator_to_grant_memberships"();



ALTER TABLE ONLY "public"."grant_budget_items"
    ADD CONSTRAINT "grant_budget_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category_lookup"("category_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."grant_budget_items"
    ADD CONSTRAINT "grant_budget_items_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("uid") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."grant_budget_items"
    ADD CONSTRAINT "grant_budget_items_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "public"."grants"("grant_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grant_memberships"
    ADD CONSTRAINT "grant_memberships_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "public"."grants"("grant_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grant_memberships"
    ADD CONSTRAINT "grant_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grants"
    ADD CONSTRAINT "grants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("uid") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."grants"
    ADD CONSTRAINT "grants_parent_grant_id_fkey" FOREIGN KEY ("parent_grant_id") REFERENCES "public"."grants"("grant_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."institutional_rules"
    ADD CONSTRAINT "institutional_rules_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "public"."grants"("grant_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."llm_logs"
    ADD CONSTRAINT "llm_logs_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("transaction_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category_lookup"("category_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("uid") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_grant_budget_item_id_fkey" FOREIGN KEY ("grant_budget_item_id") REFERENCES "public"."grant_budget_items"("grant_budget_item_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "public"."grants"("grant_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("uid") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_uid_fkey" FOREIGN KEY ("uid") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."category_lookup" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "category_lookup_delete_service" ON "public"."category_lookup" FOR DELETE USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "category_lookup_insert_service" ON "public"."category_lookup" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "category_lookup_select_all" ON "public"."category_lookup" FOR SELECT USING (true);



CREATE POLICY "category_lookup_update_service" ON "public"."category_lookup" FOR UPDATE USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."grant_budget_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "grant_budget_items_delete_member" ON "public"."grant_budget_items" FOR DELETE USING (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "grant_budget_items_insert_member" ON "public"."grant_budget_items" FOR INSERT WITH CHECK ((("public"."is_grant_member"("grant_id") AND ("entered_by" = ( SELECT "auth"."uid"() AS "uid"))) OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "grant_budget_items_select_member" ON "public"."grant_budget_items" FOR SELECT USING (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "grant_budget_items_update_member" ON "public"."grant_budget_items" FOR UPDATE USING (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text"))) WITH CHECK (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



ALTER TABLE "public"."grant_memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "grant_memberships_delete_self_or_admin" ON "public"."grant_memberships" FOR DELETE USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "grant_memberships_insert_admin" ON "public"."grant_memberships" FOR INSERT WITH CHECK (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "grant_memberships_select_member" ON "public"."grant_memberships" FOR SELECT USING (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "grant_memberships_update_admin" ON "public"."grant_memberships" FOR UPDATE USING (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text"))) WITH CHECK (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



ALTER TABLE "public"."grants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "grants_delete_creator_or_admin" ON "public"."grants" FOR DELETE USING ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id")));



CREATE POLICY "grants_insert_authenticated" ON "public"."grants" FOR INSERT WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "grants_select_member_or_creator_or_service" ON "public"."grants" FOR SELECT USING ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "grants_update_creator_or_admin" ON "public"."grants" FOR UPDATE USING ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id"))) WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id")));



ALTER TABLE "public"."institutional_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "institutional_rules_delete_admin" ON "public"."institutional_rules" FOR DELETE USING (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "institutional_rules_insert_admin" ON "public"."institutional_rules" FOR INSERT WITH CHECK (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "institutional_rules_select_member" ON "public"."institutional_rules" FOR SELECT USING (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "institutional_rules_update_admin" ON "public"."institutional_rules" FOR UPDATE USING (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text"))) WITH CHECK (("public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



ALTER TABLE "public"."llm_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "llm_logs_manage_service" ON "public"."llm_logs" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transactions_delete_owner_or_admin" ON "public"."transactions" FOR DELETE USING ((("entered_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "transactions_insert_member" ON "public"."transactions" FOR INSERT WITH CHECK ((("public"."is_grant_member"("grant_id") AND ("entered_by" = ( SELECT "auth"."uid"() AS "uid"))) OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "transactions_select_member" ON "public"."transactions" FOR SELECT USING (("public"."is_grant_member"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



CREATE POLICY "transactions_update_owner_or_admin" ON "public"."transactions" FOR UPDATE USING ((("entered_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text"))) WITH CHECK ((("entered_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin_for_grant"("grant_id") OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_delete_service" ON "public"."users" FOR DELETE USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "users_insert_service" ON "public"."users" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "users_select" ON "public"."users" FOR SELECT TO "anon" USING (("uid" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_update_service" ON "public"."users" FOR UPDATE USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grant_budget_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."grant_memberships";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_creator_to_grant_memberships"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_creator_to_grant_memberships"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_creator_to_grant_memberships"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_budget_summary"("p_grant_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_budget_summary"("p_grant_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_budget_summary"("p_grant_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_for_grant"("grant_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_for_grant"("grant_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_for_grant"("grant_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_grant_member"("grant_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."is_grant_member"("grant_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_grant_member"("grant_id" integer) TO "service_role";


















GRANT ALL ON TABLE "public"."category_lookup" TO "anon";
GRANT ALL ON TABLE "public"."category_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."category_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."category_lookup_category_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."category_lookup_category_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."category_lookup_category_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."grant_budget_items" TO "anon";
GRANT ALL ON TABLE "public"."grant_budget_items" TO "authenticated";
GRANT ALL ON TABLE "public"."grant_budget_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."grant_budget_items_grant_budget_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."grant_budget_items_grant_budget_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."grant_budget_items_grant_budget_item_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."grant_memberships" TO "anon";
GRANT ALL ON TABLE "public"."grant_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."grant_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."grants" TO "anon";
GRANT ALL ON TABLE "public"."grants" TO "authenticated";
GRANT ALL ON TABLE "public"."grants" TO "service_role";



GRANT ALL ON SEQUENCE "public"."grants_grant_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."grants_grant_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."grants_grant_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."institutional_rules" TO "anon";
GRANT ALL ON TABLE "public"."institutional_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."institutional_rules" TO "service_role";



GRANT ALL ON SEQUENCE "public"."institutional_rules_rule_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."institutional_rules_rule_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."institutional_rules_rule_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."llm_logs" TO "anon";
GRANT ALL ON TABLE "public"."llm_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."llm_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."llm_logs_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."llm_logs_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."llm_logs_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transactions_transaction_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transactions_transaction_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transactions_transaction_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































