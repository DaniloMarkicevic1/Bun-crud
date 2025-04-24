import { db } from "./db";
import { getUserInfoByToken } from "./src/users/users";
import {
  addExpenseForUser,
  deleteExpenseForUser,
  editExpenseForUser,
  getUserExpenses,
} from "./src/expenses/expenses";
import {
  loginUser,
  registerUser,
  revokeToken,
  type RegisterUserProps,
} from "./src/users/actions";
import { withGlobalHeaders } from "./headers";

db.run(`
  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

db.run("PRAGMA foreign_keys = ON");
const OPTIONS = () => withGlobalHeaders(new Response(null))
const server = Bun.serve({
  routes: {
    '/api/user': {
      POST: async req => {
        const tokenRequest: { token: string } = await req.json();
        const user = getUserInfoByToken(tokenRequest.token);

        return withGlobalHeaders(new Response(JSON.stringify(user)));
      },
      OPTIONS
    },
    '/api/expense': {
      OPTIONS,
      POST: async req => {
        const createExpenseRequest = await req.json();
        const expense = addExpenseForUser(createExpenseRequest);

        return withGlobalHeaders(new Response(JSON.stringify(expense)));
      },
      PATCH: async req => {
        const editExpenseReuqest = await req.json();
        const expense = editExpenseForUser(editExpenseReuqest);

        return withGlobalHeaders(new Response(JSON.stringify(expense)));
      },
      DELETE: async req => {
        const deleteExpenseRequest = await req.json();
        const expense = deleteExpenseForUser(deleteExpenseRequest);

        return withGlobalHeaders(new Response(JSON.stringify(expense)));
      }
    },
    '/api/expenses': {
      GET: req => {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        if (userId) {
          const page = (searchParams.get('page'));
          const pageSize = (searchParams.get('pageSize'));
          const expensesList = getUserExpenses({ userId: +userId, page: page ? +page : undefined, pageSize: pageSize ? +pageSize : undefined });

          return withGlobalHeaders(new Response(JSON.stringify(expensesList)));
        } else {
          return withGlobalHeaders(new Response("Error", { status: 500 }));
        }
      },
      OPTIONS
    },
    '/api/login': {
      POST: async req => {
        const loginRequest: RegisterUserProps = await req.json();
        const loginRes = await loginUser(loginRequest);

        if (!loginRes) {
          return withGlobalHeaders(new Response(JSON.stringify("Invalid username or password"), {
            status: 401,
          }));
        }

        return withGlobalHeaders(new Response(JSON.stringify(loginRes)))
      },
      OPTIONS
    },
    '/api/signup': {
      POST: async req => {

        const signUpRequest: RegisterUserProps = await req.json();
        const signupRes = await registerUser(signUpRequest);

        return withGlobalHeaders(new Response(JSON.stringify(signupRes)));
      },
      OPTIONS
    },
    '/api/logout':
    {
      POST: async req => {
        const body: { token?: string } = await req.json()
        revokeToken(body?.token as string);
        return withGlobalHeaders(new Response(JSON.stringify("Logout User Successfully!")));
      },
      OPTIONS
    }

  },
})


console.log(`Listening on http://localhost:${server.port} ...`);
