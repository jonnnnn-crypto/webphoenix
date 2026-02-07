import { createClient } from '@supabase/supabase-js'
import './style.css'

// Initialize Supabase settings from Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Conditional initialization
const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_SUPABASE_URL'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

document.addEventListener('DOMContentLoaded', () => {
  setupAnimations();
  setupNavbar();
  fetchDocumentation();
  fetchMembers();
});

function setupAnimations() {
  // ... existing animation code ...
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
        entry.target.classList.remove('opacity-0', 'translate-y-[30px]');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const fadeElements = document.querySelectorAll('.fade-in');
  fadeElements.forEach(el => {
    el.classList.add('opacity-0', 'translate-y-[30px]'); // Initial state
    observer.observe(el);
  });
}

// ... existing navbar code ...
function setupNavbar() {
  const navbar = document.querySelector('nav');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('py-4', 'bg-cyber-dark/95');
        navbar.classList.remove('py-6', 'bg-cyber-dark/80');
      } else {
        navbar.classList.add('py-6', 'bg-cyber-dark/80');
        navbar.classList.remove('py-4', 'bg-cyber-dark/95');
      }
    });
  }
}

// ... existing documentation fetch ...
async function fetchDocumentation() {
  const docContainer = document.querySelector('#docs .grid');
  if (!docContainer) return;

  if (!supabase) {
    console.warn('Supabase not configured. Using static fallback for docs.');
    return;
  }

  const { data, error } = await supabase
    .from('documentation')
    .select('*')
    .order('date', { ascending: false })

  if (!error && data && data.length > 0) {
    docContainer.innerHTML = '';
    data.forEach((doc: any, index: number) => {
      const article = document.createElement('article');
      article.className = `glass-card rounded-2xl overflow-hidden hover:-translate-y-2 hover:border-cyber-blue transition-all duration-300 fade-in translate-y-[30px] opacity-0 flex flex-col h-full group`;
      article.style.animationDelay = `${(index + 1) * 100}ms`;
      article.classList.add('animate-fade-in');

      const imageUrl = doc.image_url || null;
      let imageBlock = '';

      if (imageUrl) {
        imageBlock = `
                    <div class="h-48 bg-gray-800/50 flex items-center justify-center relative overflow-hidden">
                        <img src="${imageUrl}" alt="${doc.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                         <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                    </div>`;
      } else {
        imageBlock = `
                    <div class="h-48 bg-gray-800/50 flex items-center justify-center relative overflow-hidden">
                         <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                         <i class="fas fa-file-alt text-4xl text-gray-600 group-hover:text-cyber-blue transition-colors z-0"></i>
                    </div>`;
      }

      article.innerHTML = `
                ${imageBlock}
                <div class="p-8 flex-1 flex flex-col items-start bg-black/20">
                    <span class="block text-xs font-bold text-cyber-blue mb-3 uppercase tracking-wider">${formatDate(doc.date)}</span>
                    <h3 class="text-xl font-bold mb-4 group-hover:text-cyber-blue transition-colors">${doc.title}</h3>
                    <p class="text-gray-400 text-sm mb-6 flex-1">${doc.description}</p>
                    <a href="${doc.link || '#'}" class="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white hover:text-cyber-blue transition-colors group/link">
                        Read More <i class="fas fa-arrow-right text-xs transform group-hover/link:translate-x-1 transition-transform"></i>
                    </a>
                </div>
             `;
      docContainer.appendChild(article);
    });
  }
}

// --- FETCH MEMBERS ---
async function fetchMembers() {
  const memberContainer = document.querySelector('#members .grid');
  if (!memberContainer) return;

  if (!supabase) {
    console.warn('Supabase not configured. Using static fallback for members.');
    return;
  }

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: true })

  if (!error && data && data.length > 0) {
    memberContainer.innerHTML = '';
    data.forEach((member: any, index: number) => {
      const div = document.createElement('div');
      div.className = `glass-card p-8 rounded-2xl text-center transition-all duration-500 hover:-translate-y-3 hover:border-cyber-blue hover:shadow-[0_10px_40px_rgba(0,243,255,0.15)] fade-in translate-y-[30px] opacity-0 group`;
      div.style.animationDelay = `${(index + 1) * 100}ms`;
      div.classList.add('animate-fade-in');

      div.innerHTML = `
                <div class="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-2 border-cyber-blue shadow-[0_0_20px_rgba(0,243,255,0.3)] group-hover:shadow-[0_0_30px_rgba(0,243,255,0.5)] transition-shadow duration-500 relative">
                    <img src="${member.image_url}" alt="${member.name}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500">
                </div>
                <h3 class="text-xl font-bold mb-2 group-hover:text-cyber-blue transition-colors">${member.name}</h3>
                <p class="text-cyber-blue/80 text-sm uppercase tracking-wider mb-6 font-semibold">${member.role}</p>
                <div class="flex justify-center gap-4">
                    ${member.linkedin_url ? `<a href="${member.linkedin_url}" target="_blank" class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 transition-all hover:bg-cyber-blue hover:text-black hover:border-cyber-blue hover:scale-110"><i class="fab fa-linkedin-in"></i></a>` : ''}
                    ${member.instagram_url ? `<a href="${member.instagram_url}" target="_blank" class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 transition-all hover:bg-cyber-blue hover:text-black hover:border-cyber-blue hover:scale-110"><i class="fab fa-instagram"></i></a>` : ''}
                </div>
            `;
      memberContainer.appendChild(div);
    });
  }
}


function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
