import { getCategories, addCategory } from './categories'; 
const USERS_KEY = "mock_users";

// Helper: get users from localStorage or start with an empty array
const getUsers = () => {
  const usersJSON = localStorage.getItem(USERS_KEY);
  return usersJSON ? JSON.parse(usersJSON) : [];
};

// Helper: save users to localStorage
const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Register user
export const registerUser = (data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!data.email || !data.password || !data.firstName || !data.lastName || !data.role) {
        reject(new Error("Registration failed. Missing fields."));
        return;
      }

      let users = getUsers();

      // Check if email already exists
      if (users.some(u => u.email === data.email)) {
        reject(new Error("Email already registered."));
        return;
      }

      // Create new user object
      const newUser = {
        id: users.length + 1,
        email: data.email,
        password: data.password,
        role: data.role,
        name: `${data.firstName} ${data.lastName}`,
      };

      users.push(newUser);
      saveUsers(users);

      resolve({
        data: {
          message: "User registered successfully",
          token: "mock-jwt-token-" + newUser.id,
          role: newUser.role,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
          },
        },
      });
    }, 500);
  });
};

// Login user
export const loginUser = ({ email, password }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.email === email && u.password === password);

      if (!user) {
        reject({ response: { data: { message: "Invalid email or password" } } });
        return;
      }

      resolve({
        data: {
          token: "mock-jwt-token-" + user.id,
          role: user.role,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        },
      });
    }, 500);
  });
};
// ✅ Get user by ID
const getUserById = (id) => {
  const users = getUsers();
  return users.find(user => user.id === Number(id));
};

// ✅ Return roles
const getRoles = () => {
  return Promise.resolve(["admin", "cashier", "manager", "inventory"]);
};


// Export getUsers so you can import it elsewhere
export {
  getUsers,
  saveUsers,
  getUserById,
  getRoles,
  getCategories,
  addCategory
};

