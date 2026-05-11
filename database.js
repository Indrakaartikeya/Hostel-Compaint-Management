// Define initial users if database doesn't exist in localStorage
const defaultUsers = {
    "1NH24CD032": { password: "1NH24CD032", role: "student" },
    "1NH24CD076": { password: "1NH24CD076", role: "student" },
    "admin": { password: "123456", role: "admin" },
    "Power Company": { password: "123456", role: "company_electric" },
    "Water Company": { password: "123456", role: "company_water" },
    "Catering Company": { password: "123456", role: "company_food" }
};

// Initialize database from localStorage and merge with defaults to ensure new roles exist
let storedUsers = JSON.parse(localStorage.getItem('usersDatabase'));
let usersDatabase = { ...defaultUsers, ...(storedUsers || {}) };

// Save back to ensure defaults are persisted
localStorage.setItem('usersDatabase', JSON.stringify(usersDatabase));

/**
 * Function to add new users in the future
 */
function addNewUser(username, password, role = "student") {
    usersDatabase[username] = { password, role };
    localStorage.setItem('usersDatabase', JSON.stringify(usersDatabase));
    console.log(`User ${username} added successfully as ${role}.`);
}

