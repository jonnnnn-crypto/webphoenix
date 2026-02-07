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
});

function setupAnimations() {
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

async function fetchDocumentation() {
  const docContainer = document.querySelector('#docs .grid');
  if (!docContainer) return;

  // Use Static Fallback if Supabase is not configured yet
  if (!supabase) {
    console.warn('Supabase not configured. Using static fallback.');
    return; // Retain static HTML skeletons
  }

  const { data, error } = await supabase
    .from('documentation')
    .select('*')
    .order('date', { ascending: false })

  if (!error && data && data.length > 0) {
    docContainer.innerHTML = ''; // Clear static content
    data.forEach((doc: any, index: number) => {
      const article = document.createElement('article');
      article.className = `glass-card rounded-2xl overflow-hidden hover:-translate-y-2 hover:border-cyber-blue transition-all duration-300 fade-in translate-y-[30px] opacity-0 flex flex-col h-full group`;
      article.style.animationDelay = `${(index + 1) * 100}ms`;
      article.classList.add('animate-fade-in'); // Trigger animation immediately since we are dynamic

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
  } else {
    console.error("Error fetching docs:", error);
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
