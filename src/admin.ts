import { createClient } from '@supabase/supabase-js'
import './style.css'

// Initialize Supabase settings from Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
    console.error('Supabase credentials missing! Check .env file.')
    // alert('Supabase not configured. Please check .env file.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// DOM Elements
const loginSection = document.getElementById('login-section') as HTMLElement
const dashboardSection = document.getElementById('dashboard-section') as HTMLElement
const loginForm = document.getElementById('login-form') as HTMLFormElement
const loginError = document.getElementById('login-error') as HTMLElement
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement
const docForm = document.getElementById('doc-form') as HTMLFormElement
const docList = document.getElementById('doc-list') as HTMLElement

// Mock Auth (Replace with Supabase Auth later)
const ADMIN_EMAIL = 'admin@phoenix.id'
const ADMIN_PASS = 'admin123'

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

// Check Auth State
if (localStorage.getItem('isAdmin') === 'true') {
    showDashboard()
}

function showDashboard() {
    loginSection.classList.add('hidden')
    dashboardSection.classList.remove('hidden')
    fetchDocs()
}

function showLogin() {
    loginSection.classList.remove('hidden')
    dashboardSection.classList.add('hidden')
}

// Fetch Documentation
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
            <button class="delete-btn text-red-500 hover:text-white transition-colors" data-id="${doc.id}">
                <i class="fas fa-trash"></i>
            </button>
        `
        docList.appendChild(item)
    })

    // Attach Delete Listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = (e.currentTarget as HTMLElement).dataset.id
            if (confirm('Are you sure you want to delete this entry?')) {
                await deleteDoc(id!)
            }
        })
    })
}

// Add Documentation
docForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const title = (document.getElementById('doc-title') as HTMLInputElement).value
    const date = (document.getElementById('doc-date') as HTMLInputElement).value
    const description = (document.getElementById('doc-desc') as HTMLTextAreaElement).value
    const image_url = (document.getElementById('doc-image') as HTMLInputElement).value
    const link = (document.getElementById('doc-link') as HTMLInputElement).value

    // Determine if insert or fallback
    // Since Supabase credentials are placeholders, we might fail here.
    // In a real scenario, this would insert.

    const { error } = await supabase
        .from('documentation')
        .insert([{ title, date, description, image_url, link }])

    if (error) {
        alert('Error adding entry (Check Supabase config): ' + error.message)
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

    if (error) {
        alert('Error deleting entry: ' + error.message)
    } else {
        fetchDocs()
    }
}
