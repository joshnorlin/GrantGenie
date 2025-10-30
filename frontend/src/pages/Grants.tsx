import { CreateGrantForm } from "../components/GrantCreator";
import { supabase } from "../App";
import { createGrant } from "../utils/supabase-client-queries/grants";

export default function Grants() {
  return (
    <div>
      <CreateGrantForm supabase={supabase} createGrant={createGrant} />
    </div>
  );
};
