// Mock auth for demo purposes when Supabase isn't configured
// Replace with real Supabase credentials in environment variables

const DEMO_ACCOUNTS = [
  { email: "aacharyaomshah@gmail.com", password: "omshahastrologer", isAdmin: true },
  { email: "user@example.com", password: "user123", isAdmin: false }
];

export interface MockUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export const mockAuth = {
  async signUp(email: string, password: string) {
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const existingUser = localStorage.getItem(`user_${email}`);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const user: MockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      isAdmin: false
    };

    localStorage.setItem(`user_${email}`, JSON.stringify({ ...user, password }));
    localStorage.setItem("currentUser", JSON.stringify(user));

    return user;
  },

  async signIn(email: string, password: string) {
    // Check demo accounts
    const demoAccount = DEMO_ACCOUNTS.find(a => a.email === email && a.password === password);
    if (demoAccount) {
      const user: MockUser = {
        id: "demo-" + email,
        email: demoAccount.email,
        isAdmin: demoAccount.isAdmin
      };
      localStorage.setItem("currentUser", JSON.stringify(user));
      return user;
    }

    // Check localStorage for custom accounts
    const storedUser = localStorage.getItem(`user_${email}`);
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.password === password) {
        const user: MockUser = {
          id: userData.id,
          email: userData.email,
          isAdmin: userData.isAdmin
        };
        localStorage.setItem("currentUser", JSON.stringify(user));
        return user;
      }
    }

    throw new Error("Invalid email or password");
  },

  async signOut() {
    localStorage.removeItem("currentUser");
  },

  async getCurrentUser(): Promise<MockUser | null> {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }
};
