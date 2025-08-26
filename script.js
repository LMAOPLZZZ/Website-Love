// Love Letter Interactive Script with Photo Upload

// Photo storage in localStorage
const PhotoStorage = {
  save: function(slotId, imageData, originalName) {
    const photoData = {
      imageData: imageData,
      originalName: originalName,
      uploadedAt: new Date().toISOString()
    };
    localStorage.setItem(`love-letter-photo-${slotId}`, JSON.stringify(photoData));
  },
  
  load: function(slotId) {
    const data = localStorage.getItem(`love-letter-photo-${slotId}`);
    return data ? JSON.parse(data) : null;
  },
  
  remove: function(slotId) {
    localStorage.removeItem(`love-letter-photo-${slotId}`);
  }
};

// Image processing utilities
const ImageUtils = {
  resizeAndCompress: function(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(blob);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  },
  
  downloadImage: function(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Photo upload functionality
class PhotoUploader {
  constructor(card) {
    this.card = card;
    this.slotId = card.dataset.slot;
    this.fileInput = card.querySelector('.file-input');
    this.placeholderContent = card.querySelector('.placeholder-content');
    this.photoDisplay = card.querySelector('.photo-display');
    this.uploadProgress = card.querySelector('.upload-progress');
    this.uploadedPhoto = card.querySelector('.uploaded-photo');
    this.progressFill = card.querySelector('.progress-fill');
    
    this.setupEventListeners();
    this.loadExistingPhoto();
  }
  
  setupEventListeners() {
    // File input change
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFile(e.target.files[0]);
      }
    });
    
    // Upload button click
    const uploadBtn = this.card.querySelector('.upload-btn');
    uploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.fileInput.click();
    });
    
    // Replace button click
    const replaceBtn = this.card.querySelector('.replace-btn');
    if (replaceBtn) {
      replaceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fileInput.click();
      });
    }
    
    // Delete button click
    const deleteBtn = this.card.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deletePhoto();
      });
    }
    
    // Drag and drop
    this.card.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.card.classList.add('drag-over');
    });
    
    this.card.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (!this.card.contains(e.relatedTarget)) {
        this.card.classList.remove('drag-over');
      }
    });
    
    this.card.addEventListener('drop', (e) => {
      e.preventDefault();
      this.card.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        this.handleFile(files[0]);
      }
    });
  }
  
  async handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }
    
    this.showProgress();
    
    try {
      // Simulate progress
      this.animateProgress();
      
      // Process image
      const compressedImageData = await ImageUtils.resizeAndCompress(file);
      
      // Save to localStorage
      PhotoStorage.save(this.slotId, compressedImageData, file.name);
      
      // Display photo
      this.displayPhoto(compressedImageData);
      
      // Download photo
      const downloadFilename = `love-letter-${this.slotId}-${file.name}`;
      ImageUtils.downloadImage(compressedImageData, downloadFilename);
      
      // Show success message
      this.showToast('Photo uploaded and downloaded successfully!', 'success');
      
    } catch (error) {
      console.error('Upload error:', error);
      this.showToast('Failed to upload photo', 'error');
    } finally {
      this.hideProgress();
    }
  }
  
  showProgress() {
    this.placeholderContent.style.display = 'none';
    this.photoDisplay.style.display = 'none';
    this.uploadProgress.style.display = 'flex';
    this.progressFill.style.width = '0%';
  }
  
  hideProgress() {
    setTimeout(() => {
      this.uploadProgress.style.display = 'none';
    }, 1000);
  }
  
  animateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 90) {
        clearInterval(interval);
        progress = 100;
      }
      this.progressFill.style.width = progress + '%';
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  }
  
  displayPhoto(imageData) {
    this.uploadedPhoto.src = imageData;
    this.placeholderContent.style.display = 'none';
    this.photoDisplay.style.display = 'block';
  }
  
  deletePhoto() {
    if (confirm('Are you sure you want to remove this photo?')) {
      PhotoStorage.remove(this.slotId);
      this.photoDisplay.style.display = 'none';
      this.placeholderContent.style.display = 'block';
      this.showToast('Photo removed successfully!', 'success');
    }
  }
  
  loadExistingPhoto() {
    const savedPhoto = PhotoStorage.load(this.slotId);
    if (savedPhoto) {
      this.displayPhoto(savedPhoto.imageData);
    }
  }
  
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : '#10b981'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  }
}

// Sparkle Effects
function createSparkle() {
  const sparkle = document.createElement('div');
  sparkle.style.cssText = `
    position: fixed;
    width: 8px;
    height: 8px;
    background: var(--rose-gold);
    border-radius: 50%;
    opacity: 0.7;
    pointer-events: none;
    z-index: 1000;
    left: ${Math.random() * window.innerWidth}px;
    top: ${Math.random() * window.innerHeight}px;
    animation: fadeIn 2s ease-out forwards, float 2.5s ease-in-out infinite;
  `;
  
  document.body.appendChild(sparkle);
  
  setTimeout(() => {
    if (sparkle.parentNode) {
      sparkle.remove();
    }
  }, 5000);
}

// Scroll to bouquet section
function scrollToBouquet() {
  const bouquetSection = document.getElementById('bouquet-section');
  if (bouquetSection) {
    bouquetSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// Gallery Modal Functions
let currentGallery = null;

// Pre-defined image arrays for expandable galleries
const GALLERY_IMAGES = {
  'My Everything': [
    'MyEv1.JPG',
    'MyEv2.JPG',
    'MyEv3.JPG',
    'MyEv4.JPG',
    'MyEv5.JPG',
    'MyEv6.jpeg',
    'MyEv7.jpeg',
    'MyEv8.jpeg',
    'MyEv9.png'
  ],
  'Our Future': [
    'Us1.jpg',
    'Us2.jpg',
    'Us3.jpeg',
    'Us4.jpeg',
    'Us5.png',
    'Us6.jpeg',
    'Us7.jpeg',
    'Us8.jpeg',
    'Us9.jpg'
  ]
};

function openGallery(title, subtitle) {
  currentGallery = { title, subtitle };
  const modal = document.getElementById('gallery-modal');
  const titleElement = document.getElementById('gallery-title-text');
  const subtitleElement = document.getElementById('gallery-subtitle-text');
  
  titleElement.textContent = title;
  subtitleElement.textContent = subtitle;
  
  // Generate photo slots with pre-loaded images
  generatePhotoSlots();
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeGallery() {
  const modal = document.getElementById('gallery-modal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  currentGallery = null;
}

function generatePhotoSlots() {
  const photoGrid = document.querySelector('.photo-grid');
  photoGrid.innerHTML = '';
  
  // Get the pre-defined images for this gallery
  const images = GALLERY_IMAGES[currentGallery.title] || [];
  
  for (let i = 1; i <= 9; i++) {
    const slot = document.createElement('div');
    slot.className = 'photo-slot';
    
    // Use pre-defined image if available
    if (images[i - 1]) {
      const imageSrc = images[i - 1];
      slot.innerHTML = `
        <img src="${imageSrc}" alt="${currentGallery.title} Photo ${i}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">
      `;
      
      // Add click handler to view image in full size
      slot.addEventListener('click', () => {
        viewFullImage(imageSrc, `${currentGallery.title} Photo ${i}`);
      });
    } else {
      // Fallback placeholder (shouldn't be needed with 9 images defined)
      slot.innerHTML = `
        <div class="photo-slot-content">
          <div class="photo-slot-heart">♡</div>
          <p class="photo-slot-text">Photo ${i}</p>
        </div>
      `;
    }
    
    photoGrid.appendChild(slot);
  }
}

// Function to view image in full size
function viewFullImage(imageSrc, altText) {
  const fullImageModal = document.createElement('div');
  fullImageModal.className = 'full-image-modal';
  fullImageModal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 1001;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    cursor: pointer;
  `;
  
  const img = document.createElement('img');
  img.src = imageSrc;
  img.alt = altText;
  img.style.cssText = `
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.9);
    color: #000;
    font-size: 2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
  `;
  
  fullImageModal.appendChild(img);
  fullImageModal.appendChild(closeBtn);
  
  // Close handlers
  const closeModal = () => {
    document.body.removeChild(fullImageModal);
  };
  
  fullImageModal.addEventListener('click', (e) => {
    if (e.target === fullImageModal) {
      closeModal();
    }
  });
  
  closeBtn.addEventListener('click', closeModal);
  
  // ESC key handler
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
  
  document.body.appendChild(fullImageModal);
}

// Intersection Observer for scroll animations
function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      }
    });
  }, observerOptions);
  
  // Observe animated elements
  const animatedElements = document.querySelectorAll('.bouquet-item, .feature-bouquet, .growing-flower');
  animatedElements.forEach(el => observer.observe(el));
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Initialize photo uploaders for main gallery cards only
  const uploadCards = document.querySelectorAll('.photo-upload-card');
  uploadCards.forEach(card => {
    new PhotoUploader(card);
  });
  
  // Setup scroll animations
  setupScrollAnimations();
  
  // Add sparkle effects periodically
  setInterval(createSparkle, 3000);
  
  // Add event listeners for modal close
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('gallery-modal')) {
      closeGallery();
    }
  });
  
  // ESC key to close gallery
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentGallery) {
      closeGallery();
    }
  });
  
  // Letter envelope interaction enhancement
  const letterEnvelope = document.getElementById('letter-envelope');
  if (letterEnvelope) {
    letterEnvelope.addEventListener('click', function() {
      this.classList.toggle('opened');
      createSparkle();
      createSparkle();
      createSparkle();
    });
  }
  
  console.log('Love Letter application initialized successfully! 💕');
});

// Export functions for global access
window.scrollToBouquet = scrollToBouquet;
window.openGallery = openGallery;
window.closeGallery = closeGallery;
