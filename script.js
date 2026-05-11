let currentUsername = "";
let currentUserRole = "";
let complaintsLog = [];
try {
    complaintsLog = JSON.parse(localStorage.getItem('complaintsLog') || '[]');
} catch (e) {
    console.error("Failed to load complaints from localStorage", e);
    complaintsLog = [];
}
let isLoggedIn = false;

const categoryLabels = {
    'electric': 'Power & Electricity',
    'water': 'Plumbing & Water',
    'food': 'Catering & Mess',
    'lost': 'Lost & Found Items',
    'other': 'Miscellaneous / Others'
};

const categoryPriorityMap = {
    'electric': 'high',
    'water': 'high',
    'food': 'medium',
    'other': 'low',
    'lost': 'low'
};

function showError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

let notificationTimeout;

function showNotification(message, title = 'System Message') {
    const modal = document.getElementById('notificationModal');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    
    if (!modal) return;
    
    // Clear any existing timeout
    clearTimeout(notificationTimeout);
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.classList.remove('hidden');
    modal.classList.remove('blink-close');
    
    // Auto close after 5 seconds with blinking
    notificationTimeout = setTimeout(() => {
        modal.classList.add('blink-close');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 800); // Match animation duration
    }, 5000);
}

function closeNotification() {
    const modal = document.getElementById('notificationModal');
    if (modal) {
        clearTimeout(notificationTimeout);
        modal.classList.add('hidden');
    }
}

function showView(viewId) {
    // Access control: Protect the complaint form and admin dashboard
    if (viewId === 'form-view' && !isLoggedIn) {
        showView('login-view');
        showError("Please login first to file a complaint.");
        return;
    }

    if (viewId === 'admin-view' && (!isLoggedIn || (currentUserRole !== 'admin' && !currentUserRole?.startsWith('company_')))) {
        showView('login-view');
        showError("Access Denied. Admin privileges required.");
        return;
    }

    // Persistent Login: If going to login view while already logged in
    if (viewId === 'login-view' && isLoggedIn) {
        if (currentUserRole === 'admin' || currentUserRole?.startsWith('company_')) {
            showView('admin-view');
        } else {
            showView('form-view');
        }
        return;
    }

    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.add('hidden');
    });
    
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
        window.scrollTo(0, 0);
        
        // Close mobile menu if open
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) navLinks.classList.remove('active');

        // Update nav active state
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            const onclickAttr = link.getAttribute('onclick') || '';
            if (onclickAttr.includes(`'${viewId}'`)) {
                link.classList.add('active');
            }
        });

        if (viewId === 'admin-view') {
            renderAdminComplaints();
            renderUserList();
        }

        if (viewId === 'my-complaints-view') {
            renderMyComplaints();
        }
    }
}

function renderMyComplaints() {
    const list = document.getElementById('student-complaints-list');
    if (!list) return;

    list.innerHTML = "";
    
    const myComplaints = complaintsLog.filter(comp => comp.user === currentUsername);

    if (myComplaints.length === 0) {
        list.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">No complaints filed yet.</td></tr>`;
        return;
    }

    myComplaints.forEach((comp) => {
        const row = document.createElement('tr');
        const status = comp.status || 'In Progress';
        const statusClass = `status-${status.replace(/\s+/g, '').toLowerCase()}`;
        const prettyCategory = categoryLabels[comp.category] || comp.category;
        const priorityClass = `priority-${(comp.priority || 'medium').toLowerCase()}`;
        
        let actionButtons = `<button class="view-btn" onclick="viewComplaintDetailByTracking('${comp.trackingId}')" title="View Details"><i class="fa-solid fa-eye"></i></button>`;
        
        if (status === 'In Query') {
            actionButtons += `<button class="view-btn" style="background: var(--primary-color); color: white; margin-left: 8px;" onclick="studentResolveComplaint('${comp.trackingId}')" title="Mark as Resolved"><i class="fa-solid fa-check"></i></button>`;
        }

        row.innerHTML = `
            <td>${comp.trackingId}</td>
            <td><span class="badge ${comp.category}">${prettyCategory}</span></td>
            <td><span class="priority-badge ${priorityClass}">${comp.priority || 'Medium'}</span></td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td>${comp.timestamp.split(',')[0]}</td>
            <td>${actionButtons}</td>
        `;
        list.appendChild(row);
    });
}

window.studentResolveComplaint = (trackingId) => {
    const index = complaintsLog.findIndex(c => c.trackingId === trackingId);
    if (index !== -1) {
        complaintsLog[index].status = 'Resolved';
        localStorage.setItem('complaintsLog', JSON.stringify(complaintsLog));
        renderMyComplaints();
        showNotification("Complaint marked as Resolved. It will now move to the Completed category in the dashboard.", "Success");
    }
};

window.viewComplaintDetailByTracking = (trackingId) => {
    const index = complaintsLog.findIndex(c => c.trackingId === trackingId);
    if (index !== -1) viewComplaintDetail(index);
};

function logout() {
    isLoggedIn = false;
    currentUsername = "";
    currentUserRole = "";
    
    const loginNavItem = document.getElementById('login-nav-item');
    const profileNavItem = document.getElementById('profile-nav-item');
    const submitNavItem = document.getElementById('submit-nav-item');
    const myComplaintsNavItem = document.getElementById('my-complaints-nav-item');
    const adminNavItem = document.getElementById('admin-nav-item');

    if (loginNavItem) loginNavItem.classList.remove('hidden');
    if (profileNavItem) profileNavItem.classList.add('hidden');
    if (submitNavItem) submitNavItem.classList.add('hidden');
    if (myComplaintsNavItem) myComplaintsNavItem.classList.add('hidden');
    if (adminNavItem) adminNavItem.classList.add('hidden');
    
    // Reset Complaint Form view state
    const complaintForm = document.getElementById('complaintForm');
    const successMessage = document.getElementById('successMessage');
    if (complaintForm) {
        complaintForm.reset();
        complaintForm.classList.remove('hidden');
    }
    if (successMessage) successMessage.classList.add('hidden');

    try {
        localStorage.setItem('complaintsLog', JSON.stringify(complaintsLog));
    } catch (e) {
        console.error("Storage error:", e);
    }
    
    showView('home-view');
}

function renderAdminComplaints() {
    // Refresh log from storage to ensure we have latest data
    complaintsLog = JSON.parse(localStorage.getItem('complaintsLog') || '[]');
    
    const list = document.getElementById('admin-complaints-list');
    const completedList = document.getElementById('admin-completed-list');
    const totalStat = document.getElementById('total-stat');
    const electricStat = document.getElementById('electric-stat');
    const waterStat = document.getElementById('water-stat');
    const foodStat = document.getElementById('food-stat');
    const lostStat = document.getElementById('lost-stat');
    const countSpan = document.getElementById('complaint-count');
    const highStat = document.getElementById('high-stat');
    const mediumStat = document.getElementById('medium-stat');
    const lowStat = document.getElementById('low-stat');
    
    if (!list) return;

    list.innerHTML = "";
    if (completedList) completedList.innerHTML = "";
    let electricCount = 0;
    let waterCount = 0;
    let foodCount = 0;
    let lostCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    let visibleComplaints = complaintsLog;
    if (currentUserRole.startsWith('company_')) {
        const allowedCategory = currentUserRole.split('_')[1];
        // Only show complaints that the admin has explicitly marked as 'Pending'
        visibleComplaints = complaintsLog.filter(c => c.category === allowedCategory && c.status === 'Pending');
    }

    // Update title and toggle based on role
    const dashboardTitle = document.querySelector('#admin-view .admin-header h2');
    const viewToggle = document.querySelector('.admin-tabs');
    if (currentUserRole.startsWith('company_')) {
        let titlePrefix = "Company";
        if (currentUserRole === 'company_electric') titlePrefix = "Power & Electricity";
        if (currentUserRole === 'company_water') titlePrefix = "Plumbing & Water";
        if (currentUserRole === 'company_food') titlePrefix = "Catering & Mess";
        if (dashboardTitle) dashboardTitle.textContent = `${titlePrefix} Dashboard`;
        if (viewToggle) viewToggle.classList.add('hidden');
    } else {
        if (dashboardTitle) dashboardTitle.textContent = "Admin Dashboard";
        if (viewToggle) viewToggle.classList.remove('hidden');
    }

    visibleComplaints.forEach((comp) => {
        const index = complaintsLog.indexOf(comp);
        if (comp.category === 'electric') electricCount++;
        if (comp.category === 'water') waterCount++;
        if (comp.category === 'food') foodCount++;
        if (comp.category === 'lost') lostCount++;

        const p = (comp.priority || 'Medium').toLowerCase();
        if (p === 'high') highCount++;
        else if (p === 'medium') mediumCount++;
        else if (p === 'low') lowCount++;

        const row = document.createElement('tr');
        const status = comp.status || 'In Progress';
        const statusClass = `status-${status.replace(/\s+/g, '').toLowerCase()}`;
        const prettyCategory = categoryLabels[comp.category] || comp.category;
        const priorityClass = `priority-${(comp.priority || 'medium').toLowerCase()}`;
        
        row.innerHTML = `
            <td>${comp.trackingId}</td>
            <td>${comp.user}</td>
            <td><span class="badge ${comp.category}">${prettyCategory}</span></td>
            <td><span class="priority-badge ${priorityClass}">${comp.priority || 'Medium'}</span></td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td>${comp.timestamp.split(',')[0]}</td>
            <td><button class="view-btn" onclick="viewComplaintDetail(${index})"><i class="fa-solid fa-eye"></i></button></td>
        `;
        if (status === 'Resolved') {
            if (completedList) completedList.appendChild(row);
        } else {
            list.appendChild(row);
        }
    });

    totalStat.textContent = visibleComplaints.length;
    electricStat.textContent = electricCount;
    waterStat.textContent = waterCount;
    if (foodStat) foodStat.textContent = foodCount;
    if (lostStat) lostStat.textContent = lostCount;
    if (highStat) highStat.textContent = highCount;
    if (mediumStat) mediumStat.textContent = mediumCount;
    if (lowStat) lowStat.textContent = lowCount;
    countSpan.textContent = visibleComplaints.length;
}

window.viewComplaintDetail = (index) => {
    const comp = complaintsLog[index];
    if (!comp) return;

    document.getElementById('det-id').textContent = comp.trackingId;
    document.getElementById('det-user').textContent = comp.user;
    document.getElementById('det-date').textContent = comp.timestamp;
    document.getElementById('det-dept').textContent = comp.department.toUpperCase();
    document.getElementById('det-cat').textContent = categoryLabels[comp.category] || comp.category;
    document.getElementById('det-priority').textContent = comp.priority || 'Medium';
    document.getElementById('det-subject').textContent = comp.subject;
    document.getElementById('det-desc').textContent = comp.description;

    const attachmentBlock = document.getElementById('det-attachment-block');
    const attachmentImg = document.getElementById('det-attachment-img');
    
    if (comp.attachment) {
        attachmentImg.src = comp.attachment;
        attachmentBlock.classList.remove('hidden');
    } else {
        attachmentImg.src = '';
        attachmentBlock.classList.add('hidden');
    }

    const detailFooter = document.querySelector('.detail-footer');
    const pendingBtn = document.querySelector('.action-btn.pending');
    const inprogressBtn = document.querySelector('.action-btn.inprogress');
    const resolveBtn = document.querySelector('.action-btn.resolve');
    const deleteBtn = document.querySelector('.action-btn.delete');
    const rejectBtn = document.querySelector('.action-btn.reject');
    
    // Hide actions for students
    if (currentUserRole === 'student') {
        detailFooter.classList.add('hidden');
    } else {
        detailFooter.classList.remove('hidden');
        
        // Hide specific actions for company roles
        if (currentUserRole.startsWith('company_')) {
            if (inprogressBtn) inprogressBtn.classList.add('hidden');
            if (deleteBtn) deleteBtn.classList.add('hidden');
        } else {
            if (inprogressBtn) inprogressBtn.classList.remove('hidden');
            if (deleteBtn) deleteBtn.classList.remove('hidden');
        }
    }
    
    if (pendingBtn) pendingBtn.onclick = () => setPending(index);
    if (inprogressBtn) inprogressBtn.onclick = () => setInProgress(index);
    if (resolveBtn) resolveBtn.onclick = () => approveComplaint(index);
    if (deleteBtn) deleteBtn.onclick = () => deleteComplaint(index);
    if (rejectBtn) rejectBtn.onclick = () => rejectComplaint(index);
    
    // Reset all
    [pendingBtn, inprogressBtn, resolveBtn, rejectBtn].forEach(btn => {
        if (btn) btn.classList.remove('active-status');
    });
    
    // Reset button labels (preserving icons)
    if (resolveBtn) resolveBtn.querySelector('span').textContent = "Approve";
    if (rejectBtn) rejectBtn.querySelector('span').textContent = "Reject";
    
    if (comp.status === 'Resolved' || comp.status === 'Approved') {
        if (resolveBtn) {
            resolveBtn.querySelector('span').textContent = "Resolved";
            resolveBtn.classList.add('active-status');
        }
    } else if (comp.status === 'In Query') {
        if (resolveBtn) {
            resolveBtn.querySelector('span').textContent = "In Query";
            resolveBtn.classList.add('active-status');
        }
    } else if (comp.status === 'Rejected') {
        if (rejectBtn) {
            rejectBtn.querySelector('span').textContent = "Rejected";
            rejectBtn.classList.add('active-status');
        }
    } else if (comp.status === 'In Progress') {
        if (inprogressBtn) inprogressBtn.classList.add('active-status');
    } else {
        // Pending or default
        if (pendingBtn) pendingBtn.classList.add('active-status');
    }

    if (pendingBtn) pendingBtn.disabled = false;
    inprogressBtn.disabled = false;
    resolveBtn.disabled = false;
    if (rejectBtn) rejectBtn.disabled = false;

    document.getElementById('complaintDetailModal').classList.remove('hidden');
};

window.approveComplaint = (index) => {
    complaintsLog[index].status = 'In Query';
    localStorage.setItem('complaintsLog', JSON.stringify(complaintsLog));
    renderAdminComplaints();
    closeDetailModal();
    showNotification("Complaint status updated to In Query.", "Status Updated");
};

window.setInProgress = (index) => {
    complaintsLog[index].status = 'In Progress';
    localStorage.setItem('complaintsLog', JSON.stringify(complaintsLog));
    renderAdminComplaints();
    closeDetailModal();
    showNotification("Complaint marked as In Progress.", "Status Updated");
};

window.setPending = (index) => {
    complaintsLog[index].status = 'Pending';
    localStorage.setItem('complaintsLog', JSON.stringify(complaintsLog));
    renderAdminComplaints();
    closeDetailModal();
    showNotification("Complaint set to Pending.", "Status Updated");
};

window.rejectComplaint = (index) => {
    complaintsLog[index].status = 'Rejected';
    localStorage.setItem('complaintsLog', JSON.stringify(complaintsLog));
    renderAdminComplaints();
    closeDetailModal();
    showNotification("Complaint has been Rejected.", "Status Updated");
};

window.deleteComplaint = (index) => {
    if (confirm("Are you sure you want to delete this complaint permanently?")) {
        complaintsLog.splice(index, 1);
        localStorage.setItem('complaintsLog', JSON.stringify(complaintsLog));
        renderAdminComplaints();
        closeDetailModal();
        showNotification("Complaint deleted successfully.", "Deleted");
    }
};

window.closeDetailModal = () => {
    document.getElementById('complaintDetailModal').classList.add('hidden');
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const complaintForm = document.getElementById('complaintForm');
    const successMessage = document.getElementById('successMessage');
    const newComplaintBtn = document.getElementById('newComplaintBtn');
    const trackingIdSpan = document.getElementById('trackingId');
    const hamburger = document.getElementById('hamburger-menu');
    const navLinksList = document.querySelector('.nav-links');
    
    // Hamburger Toggle
    if (hamburger && navLinksList) {
        hamburger.addEventListener('click', () => {
            navLinksList.classList.toggle('active');
        });
    }

    // Success Display Elements
    const displayUser = document.getElementById('displayUser');
    const displayDept = document.getElementById('displayDept');
    const displayCat = document.getElementById('displayCat');
    const displayComplaint = document.getElementById('displayComplaint');

    // Nav Links handling
    // Handled via inline onclick for better reliability in this SPA structure

    // Login logic
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const usernameInput = document.getElementById('loginUser').value;
        const passwordInput = document.getElementById('loginPass').value;
        const loginBtn = loginForm.querySelector('.login-btn');
        const originalText = loginBtn.innerHTML;
        
        loginError.classList.add('hidden');
        loginBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';
        loginBtn.disabled = true;

        setTimeout(() => {
            try {
                const user = usersDatabase[usernameInput];
                if (user && user.password === passwordInput) {
                    isLoggedIn = true;
                    currentUsername = usernameInput;
                    currentUserRole = user.role;
                    
                    const loginNavItem = document.getElementById('login-nav-item');
                    const profileNavItem = document.getElementById('profile-nav-item');
                    const adminNavItem = document.getElementById('admin-nav-item');
                    const submitNavItem = document.getElementById('submit-nav-item');
                    const myComplaintsNavItem = document.getElementById('my-complaints-nav-item');

                    if (loginNavItem) loginNavItem.classList.add('hidden');
                    if (profileNavItem) profileNavItem.classList.remove('hidden');
                    
                    // Set the tooltip to show the username and role
                    const tooltipUser = document.getElementById('tooltip-user');
                    const tooltipRole = document.getElementById('tooltip-role');
                    if (tooltipUser) tooltipUser.textContent = currentUsername;
                    if (tooltipRole) {
                        let formattedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
                        if (user.role.startsWith('company_')) formattedRole = "Company Admin";
                        tooltipRole.textContent = formattedRole;
                    }

                    if (user.role === 'admin' || user.role.startsWith('company_')) {
                        if (adminNavItem) adminNavItem.classList.remove('hidden');
                        if (submitNavItem) submitNavItem.classList.add('hidden');
                        if (myComplaintsNavItem) myComplaintsNavItem.classList.add('hidden');
                        showView('admin-view');
                    } else {
                        if (adminNavItem) adminNavItem.classList.add('hidden');
                        if (submitNavItem) submitNavItem.classList.remove('hidden');
                        if (myComplaintsNavItem) myComplaintsNavItem.classList.remove('hidden');
                        
                        // Direct redirect to form instead of showing modal
                        const studentIdInput = document.getElementById('studentId');
                        if (studentIdInput) studentIdInput.value = currentUsername;
                        showView('form-view');
                    }
                    
                    loginForm.reset();
                    loginBtn.innerHTML = originalText;
                    loginBtn.disabled = false;
                    showNotification("Login successful! Welcome back.", "Login Success");
                } else {
                    showNotification("Invalid Username or Password. Please try again.", "Login Failed");
                    loginBtn.innerHTML = originalText;
                    loginBtn.disabled = false;
                }
            } catch (error) {
                console.error("Login Error:", error);
                showError("An internal error occurred during login. Please contact support.");
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        }, 1200);
    });

    // Complaint form submission
    complaintForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const dept = document.getElementById('department').value;
        const category = document.getElementById('category').value;
        const priority = document.getElementById('priority').value;
        const subject = document.getElementById('subject').value;
        const description = document.getElementById('description').value;
        const attachmentInput = document.getElementById('attachment');
        
        const submitBtn = complaintForm.querySelector('.submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';
        submitBtn.disabled = true;

        const processSubmission = (base64Image) => {
            setTimeout(() => {
                const randomId = Math.floor(Math.random() * 90000) + 10000;
                const trackingId = `#CMP${randomId}`;
                
                // Log the complaint
                const newComplaint = {
                    trackingId,
                    user: currentUsername,
                    department: dept,
                    category: category,
                    priority: priority.charAt(0).toUpperCase() + priority.slice(1),
                    subject: subject,
                    description: description,
                    attachment: base64Image,
                    status: 'In Progress',
                    timestamp: new Date().toLocaleString()
                };
                
                complaintsLog.push(newComplaint);
                localStorage.setItem('complaintsLog', JSON.stringify(complaintsLog));

                // Display details on success screen
                trackingIdSpan.textContent = trackingId;
                displayUser.textContent = currentUsername;
                displayDept.textContent = dept.charAt(0).toUpperCase() + dept.slice(1);
                displayCat.textContent = categoryLabels[category] || category;
                displayComplaint.textContent = description;

                complaintForm.classList.add('hidden');
                successMessage.classList.remove('hidden');

                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                showNotification(`Complaint submitted successfully! Your tracking ID is: ${trackingId}`, 'Success');
                
                console.log("New Complaint Saved:", newComplaint);
            }, 1500);
        };

        if (attachmentInput && attachmentInput.files && attachmentInput.files[0]) {
            const file = attachmentInput.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                processSubmission(event.target.result);
            };
            // Limit file size to ~4MB to prevent localStorage overflow
            if (file.size > 4 * 1024 * 1024) {
                showNotification("Image is too large. Please select an image under 4MB.", "Error");
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                return;
            }
            reader.readAsDataURL(file);
        } else {
            processSubmission(null);
        }
    });

    newComplaintBtn.addEventListener('click', () => {
        complaintForm.reset();
        
        // Auto-fill User ID again
        const studentIdInput = document.getElementById('studentId');
        if (studentIdInput) studentIdInput.value = currentUsername;

        if (prioritySelect) {
            prioritySelect.disabled = true;
            prioritySelect.style.cursor = 'not-allowed';
            prioritySelect.style.opacity = '0.7';
        }
        successMessage.classList.add('hidden');
        complaintForm.classList.remove('hidden');
    });

    // Auto-update priority based on category selection
    const categorySelect = document.getElementById('category');
    const prioritySelect = document.getElementById('priority');
    
    if (categorySelect && prioritySelect) {
        categorySelect.addEventListener('change', () => {
            const selectedCategory = categorySelect.value;
            const recommendedPriority = categoryPriorityMap[selectedCategory];
            if (recommendedPriority) {
                prioritySelect.value = recommendedPriority;
                
                // Lock the priority field as per user request
                prioritySelect.disabled = true;
                prioritySelect.style.cursor = 'not-allowed';
                prioritySelect.style.opacity = '0.7';
                
                // Visual feedback
                prioritySelect.parentElement.style.borderColor = 'var(--primary-color)';
                setTimeout(() => {
                    prioritySelect.parentElement.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }, 1000);
            }
        });
    }

    // Add User Form Submission
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('newUsername').value;
            const pass = document.getElementById('newUserPass').value;
            const role = document.getElementById('newUserRole').value;

            if (usersDatabase[username]) {
                alert("User already exists!");
                return;
            }

            addNewUser(username, pass, role);
            addUserForm.reset();
            renderUserList();
            alert(`User ${username} added successfully!`);
        });
    }
});

// Admin Dashboard Functions
window.switchAdminTab = (tab) => {
    const complaintsSec = document.getElementById('admin-complaints-sec');
    const completedSec = document.getElementById('admin-completed-sec');
    const usersSec = document.getElementById('admin-users-sec');
    const complaintsTab = document.getElementById('tab-complaints');
    const completedTab = document.getElementById('tab-completed');
    const usersTab = document.getElementById('tab-users');

    complaintsSec.classList.add('hidden');
    if (completedSec) completedSec.classList.add('hidden');
    usersSec.classList.add('hidden');
    complaintsTab.classList.remove('active');
    if (completedTab) completedTab.classList.remove('active');
    usersTab.classList.remove('active');

    if (tab === 'complaints') {
        complaintsSec.classList.remove('hidden');
        complaintsTab.classList.add('active');
        renderAdminComplaints();
    } else if (tab === 'completed') {
        if (completedSec) completedSec.classList.remove('hidden');
        if (completedTab) completedTab.classList.add('active');
        renderAdminComplaints();
    } else {
        usersSec.classList.remove('hidden');
        usersTab.classList.add('active');
        renderUserList();
    }
};

window.refreshAdminData = () => {
    renderAdminComplaints();
    renderUserList();
};

window.renderUserList = () => {
    const list = document.getElementById('admin-users-list');
    if (!list) return;

    list.innerHTML = "";
    
    // Refresh database from localStorage in case it changed
    usersDatabase = JSON.parse(localStorage.getItem('usersDatabase')) || defaultUsers;

    Object.keys(usersDatabase).forEach(username => {
        const user = usersDatabase[username];
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${username}</td>
            <td><span class="badge ${user.role}">${user.role.toUpperCase()}</span></td>
            <td>
                ${username === 'admin' ? '<span class="text-muted">System</span>' : 
                `<button class="delete-user-btn" onclick="deleteUser('${username}')"><i class="fa-solid fa-trash"></i></button>`}
            </td>
        `;
        list.appendChild(row);
    });
};

window.deleteUser = (username) => {
    if (username === 'admin') {
        alert("Cannot delete primary admin account.");
        return;
    }

    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
        delete usersDatabase[username];
        localStorage.setItem('usersDatabase', JSON.stringify(usersDatabase));
        renderUserList();
    }
};
