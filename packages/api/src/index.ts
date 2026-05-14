import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error("Supabase env vars missing");
const supabase = createClient(supabaseUrl, supabaseKey);
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret_change_me";
const DATA_FILE = path.join(__dirname, "..", "data", "store.json");

type UserRecord = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  password: string;
  country: string | null;
  created_at: string;
};

type TransactionRecord = {
  id: number;
  user_id: number;
  type: string;
  name: string | null;
  category: string | null;
  amount: number;
  date: string;
  created_at: string;
};

type LocalStore = {
  users: UserRecord[];
  transactions: TransactionRecord[];
  nextUserId: number;
  nextTransactionId: number;
};

let storageMode: "supabase" | "local" = "supabase";

function defaultStore(): LocalStore {
  return {
    users: [],
    transactions: [],
    nextUserId: 1,
    nextTransactionId: 1,
  };
}

async function readLocalStore(): Promise<LocalStore> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    return {
      users: parsed.users ?? [],
      transactions: parsed.transactions ?? [],
      nextUserId: parsed.nextUserId ?? 1,
      nextTransactionId: parsed.nextTransactionId ?? 1,
    };
  } catch (error: any) {
    if (error.code === "ENOENT") {
      const initial = defaultStore();
      await writeLocalStore(initial);
      return initial;
    }
    throw error;
  }
}

async function writeLocalStore(store: LocalStore) {
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

function isMissingSupabaseTable(error: any) {
  const message = String(error?.message ?? "").toLowerCase();
  return (
    message.includes("schema cache") ||
    message.includes("could not find the table") ||
    message.includes("relation") && message.includes("does not exist")
  );
}

function switchToLocalStorage(error: any) {
  if (storageMode === "local") return;
  if (!isMissingSupabaseTable(error)) return;

  storageMode = "local";
  console.warn("Supabase schema is missing required tables; using local file storage instead.");
}

async function detectStorageMode() {
  const { error } = await supabase.from("users").select("id").limit(1);
  switchToLocalStorage(error);
}

async function createUser(input: {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  country?: string;
}): Promise<UserRecord> {
  if (storageMode === "supabase") {
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          password: input.password,
          country: input.country,
        },
      ])
      .select()
      .single();

    if (!error) return data as UserRecord;
    switchToLocalStorage(error);
    if (storageMode === "supabase") throw error;
  }

  const store = await readLocalStore();
  const existing = store.users.find(user => user.email.toLowerCase() === input.email.toLowerCase());
  if (existing) throw new Error("duplicate key value violates unique constraint \"users_email_key\"");

  const user: UserRecord = {
    id: store.nextUserId,
    first_name: input.firstName ?? null,
    last_name: input.lastName ?? null,
    email: input.email,
    password: input.password,
    country: input.country ?? null,
    created_at: new Date().toISOString(),
  };

  store.users.push(user);
  store.nextUserId += 1;
  await writeLocalStore(store);
  return user;
}

async function findUserByEmail(email: string): Promise<UserRecord | null> {
  if (storageMode === "supabase") {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
    if (!error) return (data as UserRecord | null) ?? null;
    switchToLocalStorage(error);
    if (storageMode === "supabase") throw error;
  }

  const store = await readLocalStore();
  return store.users.find(user => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

async function findUserById(id: number): Promise<UserRecord | null> {
  if (storageMode === "supabase") {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    if (!error) return (data as UserRecord | null) ?? null;
    switchToLocalStorage(error);
    if (storageMode === "supabase") throw error;
  }

  const store = await readLocalStore();
  return store.users.find(user => user.id === id) ?? null;
}

async function createTransaction(input: {
  userId: number;
  name?: string;
  category?: string;
  amount: number;
  date: string;
  type: string;
}): Promise<TransactionRecord> {
  if (storageMode === "supabase") {
    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: input.userId,
          name: input.name,
          category: input.category,
          amount: input.amount,
          date: input.date,
          type: input.type,
        },
      ])
      .select()
      .single();

    if (!error) return data as TransactionRecord;
    switchToLocalStorage(error);
    if (storageMode === "supabase") throw error;
  }

  const store = await readLocalStore();
  const transaction: TransactionRecord = {
    id: store.nextTransactionId,
    user_id: input.userId,
    name: input.name ?? null,
    category: input.category ?? null,
    amount: input.amount,
    date: input.date,
    type: input.type,
    created_at: new Date().toISOString(),
  };

  store.transactions.push(transaction);
  store.nextTransactionId += 1;
  await writeLocalStore(store);
  return transaction;
}

async function listTransactions(userId: number): Promise<TransactionRecord[]> {
  if (storageMode === "supabase") {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (!error) return (data as TransactionRecord[]) ?? [];
    switchToLocalStorage(error);
    if (storageMode === "supabase") throw error;
  }

  const store = await readLocalStore();
  return [...store.transactions]
    .filter(transaction => transaction.user_id === userId)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

async function getSummary(userId: number) {
  if (storageMode === "supabase") {
    const { data: incomesData, error: incomeError } = await supabase.rpc("sum_transactions_by_type", {
      p_user_id: userId,
      p_type: "INCOME",
    });
    const { data: expensesData, error: expenseError } = await supabase.rpc("sum_transactions_by_type", {
      p_user_id: userId,
      p_type: "EXPENSE",
    });

    if (!incomeError && !expenseError) {
      return {
        totalIncome: (incomesData as any)?.[0]?.sum ?? 0,
        totalExpense: (expensesData as any)?.[0]?.sum ?? 0,
      };
    }

    switchToLocalStorage(incomeError ?? expenseError);
    if (storageMode === "supabase") throw incomeError ?? expenseError;
  }

  const transactions = await listTransactions(userId);
  return transactions.reduce(
    (totals, transaction) => {
      if (transaction.type === "INCOME") totals.totalIncome += Number(transaction.amount);
      if (transaction.type === "EXPENSE") totals.totalExpense += Number(transaction.amount);
      return totals;
    },
    { totalIncome: 0, totalExpense: 0 }
  );
}

function sign(user: { id: number; email: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

app.post("/api/auth/register", async (req, res) => {
  const { firstName, lastName, email, password, country } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email+password required" });
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await createUser({ firstName, lastName, email, password: hashed, country });
    const token = sign({ id: user.id, email: user.email });
    res.json({ token, user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  let user: UserRecord | null;
  try {
    user = await findUserByEmail(email);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
  if (!user) return res.status(401).json({ error: "invalid credentials" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });
  const token = sign({ id: user.id, email: user.email });
  res.json({ token, user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email } });
});

function auth(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "missing token" });
  const token = header.replace("Bearer ", "");
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "invalid token" });
  }
}

app.get("/api/me", auth, async (req: any, res) => {
  try {
    const user = await findUserById(req.user.id);
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/transactions", auth, async (req: any, res) => {
  const { name, category, amount, date, type } = req.body;
  if (!name || !amount || !type) return res.status(400).json({ error: "missing fields" });
  try {
    const transaction = await createTransaction({
      userId: req.user.id,
      name,
      category,
      amount: Number(amount),
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      type,
    });
    res.json({ transaction });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/transactions", auth, async (req: any, res) => {
  try {
    const transactions = await listTransactions(req.user.id);
    res.json({ transactions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/summary", auth, async (req: any, res) => {
  try {
    const summary = await getSummary(req.user.id);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT ?? 4000;

detectStorageMode()
  .catch(error => {
    console.warn(`Storage detection failed: ${error.message}`);
  })
  .finally(() => {
    app.listen(port, () => console.log(`API running on http://localhost:${port}`));
  });
