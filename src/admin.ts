import { createClient } from '@supabase/supabase-js'
import './style.css'

// Initialize Supabase settings from Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
    console.error('Supabase credentials missing! Check .env file.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// DOM Elements
const loginSection = document.getElementById('login-section') as HTMLElement
const dashboardSection = document.getElementById('dashboard-section') as HTMLElement
const loginForm = document.getElementById('login-form') as HTMLFormElement
const loginError = document.getElementById('login-error') as HTMLElement
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement

// Views
const viewDocs = document.getElementById('view-docs') as HTMLElement
const viewMembers = document.getElementById('view-members') as HTMLElement
const tabDocs = document.getElementById('tab-docs') as HTMLElement
const tabMembers = document.getElementById('tab-members') as HTMLElement

// Doc Elements
const docForm = document.getElementById('doc-form') as HTMLFormElement
const docList = document.getElementById('doc-list') as HTMLElement
const docFileInput = document.getElementById('doc-image-file') as HTMLInputElement
const docFileLabel = document.getElementById('doc-file-label') as HTMLElement
const docSubmitBtn = document.getElementById('doc-submit-btn') as HTMLButtonElement

// Member Elements
const memberForm = document.getElementById('member-form') as HTMLFormElement
const memberList = document.getElementById('member-list') as HTMLElement
const memberFileInput = document.getElementById('member-image-file') as HTMLInputElement
const memberFileLabel = document.getElementById('member-file-label') as HTMLElement
const memberSubmitBtn = document.getElementById('member-submit-btn') as HTMLButtonElement

// Admin Credentials
const ADMIN_EMAIL = 'admin@phoenix.id'
const ADMIN_PASS = 'Phoenix_X_2026_Secure!'

// Login Handling
loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const email = (document.getElementById('email') as HTMLInputElement).value
    const password = (document.getElementById('password') as HTMLInputElement).value

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        localStorage.setItem('isAdmin', 'true')
        showDashboard()
    } else {
        loginError.textContent = 'Invalid credentials'
        loginError.classList.remove('hidden')
    }
})

// Logout Handling
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isAdmin')
    showLogin()
})

// Tab Switching
tabDocs.addEventListener('click', () => {
    switchTab('docs')
})

tabMembers.addEventListener('click', () => {
    switchTab('members')
})

function switchTab(tab: 'docs' | 'members') {
    if (tab === 'docs') {
        viewDocs.classList.remove('hidden')
        viewMembers.classList.add('hidden')
        tabDocs.classList.add('bg-cyber-blue', 'text-black')
        tabDocs.classList.remove('text-gray-400')
        tabMembers.classList.remove('bg-cyber-blue', 'text-black')
        tabMembers.classList.add('text-gray-400')
        fetchDocs()
    } else {
        viewDocs.classList.add('hidden')
        viewMembers.classList.remove('hidden')
        tabMembers.classList.add('bg-cyber-blue', 'text-black')
        tabMembers.classList.remove('text-gray-400')
        tabDocs.classList.remove('bg-cyber-blue', 'text-black')
        tabDocs.classList.add('text-gray-400')
        fetchMembers()
    }
}

// Check Auth State
if (localStorage.getItem('isAdmin') === 'true') {
    showDashboard()
}

function showDashboard() {
    loginSection.classList.add('hidden')
    dashboardSection.classList.remove('hidden')
    fetchDocs() // Default view
}

function showLogin() {
    loginSection.classList.remove('hidden')
    dashboardSection.classList.add('hidden')
}

// --- FILE UPLOAD LOGIC ---

function setupFileUpload(input: HTMLInputElement, label: HTMLElement) {
    input.addEventListener('change', () => {
        if (input.files && input.files[0]) {
            label.textContent = `Selected: ${input.files[0].name}`;
            label.classList.add('text-cyber-blue');
        }
    });
}

setupFileUpload(docFileInput, docFileLabel);
setupFileUpload(memberFileInput, memberFileLabel);

async function uploadImage(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file)

    if (error) {
        console.error('Upload Error:', error)
        alert('Failed to upload image: ' + error.message)
        return null
    }

    const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

    return publicUrl
}

// --- DOCUMENTATION LOGIC ---

async function fetchDocs() {
    docList.innerHTML = '<div class="text-center text-gray-500 py-8">Loading...</div>'

    const { data, error } = await supabase
        .from('documentation')
        .select('*')
        .order('date', { ascending: false })

    if (error) {
        docList.innerHTML = `<div class="text-red-500 text-center">Error fetching data: ${error.message}</div>`
        return
    }

    if (data && data.length > 0) {
        renderDocs(data)
    } else {
        docList.innerHTML = '<div class="text-center text-gray-500 py-8">No entries found.</div>'
    }
}

function renderDocs(docs: any[]) {
    docList.innerHTML = ''
    docs.forEach(doc => {
        const item = document.createElement('div')
        item.className = 'bg-black/40 border border-white/5 rounded p-4 flex justify-between items-center'
        item.innerHTML = `
            <div>
                <h4 class="font-bold text-cyber-blue">${doc.title}</h4>
                <p class="text-xs text-gray-500">${doc.date}</p>
            </div>
            <button class="delete-doc-btn text-red-500 hover:text-white transition-colors" data-id="${doc.id}">
                <i class="fas fa-trash"></i>
            </button>
        `
        docList.appendChild(item)
    })

    document.querySelectorAll('.delete-doc-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = (e.currentTarget as HTMLElement).dataset.id
            if (confirm('Are you sure you want to delete this entry?')) {
                await deleteDoc(id!)
            }
        })
    })
}

docForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    // Disable button state
    const originalBtnText = docSubmitBtn.textContent;
    docSubmitBtn.textContent = 'Uploading...';
    docSubmitBtn.disabled = true;

    try {
        const title = (document.getElementById('doc-title') as HTMLInputElement).value
        const date = (document.getElementById('doc-date') as HTMLInputElement).value
        const description = (document.getElementById('doc-desc') as HTMLTextAreaElement).value
        const link = (document.getElementById('doc-link') as HTMLInputElement).value
        let image_url = ''

        if (docFileInput.files && docFileInput.files[0]) {
            const uploadedUrl = await uploadImage(docFileInput.files[0])
            if (uploadedUrl) image_url = uploadedUrl
            else throw new Error('Image upload failed')
        }

        const { error } = await supabase
            .from('documentation')
            .insert([{ title, date, description, image_url, link }])

        if (error) {
            throw error;
        }

        (e.target as HTMLFormElement).reset();
        docFileLabel.textContent = 'Drag & Drop or Click to Upload';
        docFileLabel.classList.remove('text-cyber-blue');
        fetchDocs();

    } catch (error: any) {
        alert('Error: ' + error.message)
    } finally {
        docSubmitBtn.textContent = originalBtnText;
        docSubmitBtn.disabled = false;
    }
})

async function deleteDoc(id: string) {
    const { error } = await supabase
        .from('documentation')
        .delete()
        .eq('id', id)
    if (error) alert('Error: ' + error.message)
    else fetchDocs()
}

// --- MEMBER LOGIC ---

async function fetchMembers() {
    memberList.innerHTML = '<div class="text-center text-gray-500 py-8">Loading...</div>'

    const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) {
        memberList.innerHTML = `<div class="text-red-500 text-center">Error fetching members: ${error.message}</div>`
        return
    }

    if (data && data.length > 0) {
        renderMembers(data)
    } else {
        memberList.innerHTML = '<div class="text-center text-gray-500 py-8">No members found.</div>'
    }
}

function renderMembers(members: any[]) {
    memberList.innerHTML = ''
    members.forEach(member => {
        const item = document.createElement('div')
        item.className = 'bg-black/40 border border-white/5 rounded p-4 flex justify-between items-center'
        item.innerHTML = `
            <div class="flex items-center gap-4">
                <img src="${member.image_url}" class="w-10 h-10 rounded-full object-cover border border-cyber-blue">
                <div>
                    <h4 class="font-bold text-white">${member.name}</h4>
                    <p class="text-xs text-cyber-blue">${member.role}</p>
                </div>
            </div>
            <button class="delete-member-btn text-red-500 hover:text-white transition-colors" data-id="${member.id}">
                <i class="fas fa-trash"></i>
            </button>
        `
        memberList.appendChild(item)
    })

    document.querySelectorAll('.delete-member-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = (e.currentTarget as HTMLElement).dataset.id
            if (confirm('Are you sure you want to delete this member?')) {
                await deleteMember(id!)
            }
        })
    })
}

memberForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const originalBtnText = memberSubmitBtn.textContent;
    memberSubmitBtn.textContent = 'Uploading...';
    memberSubmitBtn.disabled = true;

    try {
        const name = (document.getElementById('member-name') as HTMLInputElement).value
        const role = (document.getElementById('member-role') as HTMLInputElement).value
        const linkedin_url = (document.getElementById('member-linkedin') as HTMLInputElement).value
        const instagram_url = (document.getElementById('member-instagram') as HTMLInputElement).value
        let image_url = ''

        if (memberFileInput.files && memberFileInput.files[0]) {
            const uploadedUrl = await uploadImage(memberFileInput.files[0])
            if (uploadedUrl) image_url = uploadedUrl
            else throw new Error('Image upload failed')
        } else {
            throw new Error('Member image is required!');
        }

        const { error } = await supabase
            .from('members')
            .insert([{ name, role, image_url, linkedin_url, instagram_url }])

        if (error) {
            throw error
        }

        (e.target as HTMLFormElement).reset();
        memberFileLabel.textContent = 'Drag & Drop or Click to Upload';
        memberFileLabel.classList.remove('text-cyber-blue');
        fetchMembers();

    } catch (error: any) {
        alert('Error: ' + error.message)
    } finally {
        memberSubmitBtn.textContent = originalBtnText;
        memberSubmitBtn.disabled = false;
    }
})

async function deleteMember(id: string) {
    const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id)
    if (error) alert('Error: ' + error.message)
    else fetchMembers()
}
