import { db } from "../../db";

// Create the expenses table if it doesn't already exist
db.run(
  `CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    amount INTEGER NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`
);
type AddExpenseForUserProps = {
  userId: number;
  name: string;
  price: number;
  amount: number;
  date: Date;
};

type EditExpenseForUserProps = {
  userId: number;
  name: string;
  price: number;
  amount: number;
  date: string;
};

type GetExpensesOfUser = {
  userId: number, page?: number, pageSize?: number
}
export function addExpenseForUser({
  userId,
  name,
  price,
  amount,
  date,
}: AddExpenseForUserProps) {
  try {
    db.run(
      "INSERT INTO expenses (user_id, name, price, amount, date) VALUES (?, ?, ?, ?, ?)",
      [
        userId,
        name,
        price,
        amount,
        new Date(date).toISOString(), // Store the date as a string in ISO format
      ]
    );
    return {
      success: true,
      message: "Expense added successfully",
      expense: { userId, name, price, amount, date },
    };
  } catch (error) {
    console.log("ERROR", error);

    return {
      success: false,
      message: "An error occurred during expense creation",
    };
  }
}

export function getUserExpenses({
  userId,
  page = 1,
  pageSize = 10
}: GetExpensesOfUser) {
  try {
    const offset = (page - 1) * pageSize;

    const expenses = db
      .query(
        `
      SELECT *
      FROM expenses
      WHERE user_id = ?
      LIMIT ? OFFSET ?
    `
      )
      .all(userId, pageSize, offset);

    console.log({ expenses });

    const totalCount = db
      .query(
        `
      SELECT COUNT(*) AS count
      FROM expenses
      WHERE user_id = ?
    `
      )
      .get(userId) as { count: number };

    const totalPages = Math.ceil(totalCount.count / pageSize);

    return {
      success: true,
      expenses,
      currentPage: page,
      totalPages,
      totalCount, // Include for client-side pagination calculations
    };
  } catch (error: any) {
    console.error("Error fetching expenses:", error.message);
    return {
      success: false,
      message: "An error occurred while fetching expenses",
    };
  }
}


export function deleteExpenseForUser({ expenseId }: { expenseId: number }) {
  try {
    const deleteExpense = db
      .prepare(`DELETE FROM expenses WHERE id = ?`)
      .run(+expenseId);
    return {
      success: true,
      message: "Expense deleted successfully",
      deleteExpense,
    };
  } catch (error) {
    console.log("ERROR", error);

    return {
      success: false,
      message: "An error occurred during expense deletion",
    };
  }
}

export function editExpenseForUser({
  userId,
  name,
  price,
  amount,
  date,
  id,
}: EditExpenseForUserProps & { id: number }) {
  try {
    console.log("User ID:", userId);
    console.log("ID:", id);

    const editExpense = db
      .prepare(
        `UPDATE expenses
      SET name = ?, price = ?, amount = ?, date = ?
      WHERE id = ? AND user_id = ?;`
      )
      .run(name, price, amount, date, id, userId);
    console.log({ editExpense });
    return {
      success: true,
      message: "Expense edited successfully",
      editExpense,
    };
  } catch (error) {
    console.log("ERROR", error);

    return {
      success: false,
      message: "An error occurred during expense edit",
    };
  }
}
