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

// Member Elements
const memberForm = document.getElementById('member-form') as HTMLFormElement
const memberList = document.getElementById('member-list') as HTMLElement

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

    const title = (document.getElementById('doc-title') as HTMLInputElement).value
    const date = (document.getElementById('doc-date') as HTMLInputElement).value
    const description = (document.getElementById('doc-desc') as HTMLTextAreaElement).value
    const image_url = (document.getElementById('doc-image') as HTMLInputElement).value
    const link = (document.getElementById('doc-link') as HTMLInputElement).value

    const { error } = await supabase
        .from('documentation')
        .insert([{ title, date, description, image_url, link }])

    if (error) {
        alert('Error adding entry: ' + error.message)
    } else {
        (e.target as HTMLFormElement).reset()
        fetchDocs()
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

    const name = (document.getElementById('member-name') as HTMLInputElement).value
    const role = (document.getElementById('member-role') as HTMLInputElement).value
    const image_url = (document.getElementById('member-image') as HTMLInputElement).value
    const linkedin_url = (document.getElementById('member-linkedin') as HTMLInputElement).value
    const instagram_url = (document.getElementById('member-instagram') as HTMLInputElement).value

    const { error } = await supabase
        .from('members')
        .insert([{ name, role, image_url, linkedin_url, instagram_url }])

    if (error) {
        alert('Error adding member: ' + error.message)
    } else {
        (e.target as HTMLFormElement).reset()
        fetchMembers()
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
