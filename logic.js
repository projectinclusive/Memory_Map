document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded');
  
  var logo = document.getElementById('logo');
  console.log('Logo element:', logo);
  
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', function(e) {
      console.log('Logo clicked');
      e.preventDefault();
      
      // Force scroll to absolute top (0,0)
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      // Also use smooth scroll as backup
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    });
  } else {
    console.error('Logo element not found');
  }

  // Language toggle functionality
  var langToggle = document.getElementById('langToggle');
  var currentLang = 'zh'; // Default language is Chinese
  
  if (langToggle) {
    langToggle.addEventListener('click', function() {
      if (currentLang === 'zh') {
        switchToEnglish();
        langToggle.textContent = '中';
        currentLang = 'en';
      } else {
        switchToChinese();
        langToggle.textContent = 'Eng';
        currentLang = 'zh';
      }
    });
  }

  // Photo gallery horizontal scroll
  var gallery = document.getElementById('gallery');
  if (gallery) {
    gallery.addEventListener('wheel', function(e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        gallery.scrollLeft += e.deltaY;
      }
    });
  }

  // Interactive map images
  initInteractiveMaps();
  
  // Photo gallery modal functionality
  initPhotoGallery();
});

function initInteractiveMaps() {
  var mapContainers = document.querySelectorAll('.map-image-container');
  
  mapContainers.forEach(function(container) {
    var image = container.querySelector('.map-image');
    var scale = 1;
    var translateX = 0;
    var translateY = 0;
    var isDragging = false;
    var startX, startY;
    
    // Determine which group this container belongs to
    var groupNumber = '00';
    if (container.closest('.map01-section')) groupNumber = '01';
    else if (container.closest('.map02-section')) groupNumber = '02';
    else if (container.closest('.map03-section')) groupNumber = '03';
    else if (container.closest('.map04-section')) groupNumber = '04';
    
    // Navigation button functionality
    var navButtons = container.querySelectorAll('.map-nav-btn');
    navButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        var buttonText = btn.textContent.trim();
        var buttonImage = btn.querySelector('.btn-icon');
        
        // Determine which button was clicked based on position and content
        var buttonType = '';
        if (buttonImage || (btn.classList.contains('map-nav-left') && !btn.classList.contains('map-nav-left-2'))) {
          buttonType = 'A';
        } else if (buttonText === 'B' || btn.classList.contains('map-nav-left-2')) {
          buttonType = 'B';
        } else if ((buttonText === 'C' || btn.classList.contains('map-nav-right')) && !btn.classList.contains('map-nav-right-2')) {
          buttonType = 'C';
        } else if (buttonText === 'D' || btn.classList.contains('map-nav-right-2')) {
          buttonType = 'D';
        }
        
        console.log('Button clicked:', buttonType, 'Group:', groupNumber);
        
        // Open modal window for corresponding pages
        if (buttonType) {
          openModal(`page/grp${groupNumber}/page${buttonType}.html`);
        }
      });
    });
    
    // Zoom with mouse wheel - smaller steps
    container.addEventListener('wheel', function(e) {
      e.preventDefault();
      
      var rect = container.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      
      var delta = e.deltaY > 0 ? 0.95 : 1.05; // Smaller zoom steps
      var newScale = Math.min(Math.max(1, scale * delta), 3); // Reduced max scale
      
      if (newScale !== scale) {
        var scaleChange = newScale / scale;
        translateX = x - scaleChange * (x - translateX);
        translateY = y - scaleChange * (y - translateY);
        scale = newScale;
        
        // Apply strict boundaries to keep image visible
        var bounds = calculateStrictBounds(container, image, scale);
        translateX = Math.min(Math.max(translateX, bounds.minX), bounds.maxX);
        translateY = Math.min(Math.max(translateY, bounds.minY), bounds.maxY);
        
        updateTransform(image, scale, translateX, translateY);
      }
    });
    
    // Pan with mouse drag - smaller movements
    container.addEventListener('mousedown', function(e) {
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      container.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      
      var newTranslateX = (e.clientX - startX) * 0.8; // Reduce movement sensitivity
      var newTranslateY = (e.clientY - startY) * 0.8;
      
      // Apply strict boundaries
      var bounds = calculateStrictBounds(container, image, scale);
      translateX = Math.min(Math.max(newTranslateX, bounds.minX), bounds.maxX);
      translateY = Math.min(Math.max(newTranslateY, bounds.minY), bounds.maxY);
      
      updateTransform(image, scale, translateX, translateY);
    });
    
    document.addEventListener('mouseup', function() {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = 'grab';
      }
    });
    
    // Double click to reset
    container.addEventListener('dblclick', function() {
      scale = 1;
      translateX = 0;
      translateY = 0;
      updateTransform(image, scale, translateX, translateY);
    });
  });
}

// Fallback openModal function if WindowManager is not loaded
function openModal(pageUrl) {
  console.warn('Using fallback modal function - window_manager.js may not be loaded');
  
  if (window.WindowManager) {
    // Use WindowManager if available
    window.WindowManager.openModal(pageUrl);
  } else {
    // Create modal overlay
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Create modal window
    var modal = document.createElement('div');
    modal.className = 'modal-window';
    
    // Create modal header with close button
    var header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <button class="modal-close">×</button>
    `;
    
    // Create modal content iframe
    var content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `<iframe src="${pageUrl}" frameborder="0"></iframe>`;
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Close functionality
    var closeBtn = header.querySelector('.modal-close');
    closeBtn.addEventListener('click', function() {
      document.body.removeChild(overlay);
    });
    
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }
}

function calculateStrictBounds(container, image, scale) {
  var containerRect = container.getBoundingClientRect();
  var imageStyle = window.getComputedStyle(image);
  var imageWidth = image.naturalWidth || parseInt(imageStyle.width);
  var imageHeight = image.naturalHeight || parseInt(imageStyle.height);
  
  // Calculate actual displayed size
  var displayedWidth = Math.min(imageWidth, containerRect.width);
  var displayedHeight = Math.min(imageHeight, containerRect.height);
  
  // Scale the displayed size
  var scaledWidth = displayedWidth * scale;
  var scaledHeight = displayedHeight * scale;
  
  // Calculate bounds to keep image always visible
  var maxX = 0;
  var maxY = 0;
  var minX = 0;
  var minY = 0;
  
  if (scaledWidth > containerRect.width) {
    maxX = (scaledWidth - containerRect.width) / 2 / scale;
    minX = -maxX;
  }
  
  if (scaledHeight > containerRect.height) {
    maxY = (scaledHeight - containerRect.height) / 2 / scale;
    minY = -maxY;
  }
  
  return {
    minX: minX,
    maxX: maxX,
    minY: minY,
    maxY: maxY
  };
}

function updateTransform(element, scale, translateX, translateY) {
  element.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
}

// Language toggle functions
function switchToEnglish() {
  var elementsToTranslate = document.querySelectorAll('[data-en]');
  elementsToTranslate.forEach(function(element) {
    element.textContent = element.getAttribute('data-en');
  });
  console.log('Switched to English');
}

function switchToChinese() {
  var elementsToTranslate = document.querySelectorAll('[data-zh]');
  elementsToTranslate.forEach(function(element) {
    element.textContent = element.getAttribute('data-zh');
  });
  console.log('Switched to Chinese');
}

// Photo Gallery Modal Functions
function initPhotoGallery() {
  var photos = document.querySelectorAll('.gallery-photo');
  var modal = document.getElementById('photoModal');
  var modalImage = document.getElementById('modalImage');
  var closeBtn = document.querySelector('.photo-modal-close');
  var prevBtn = document.getElementById('prevPhoto');
  var nextBtn = document.getElementById('nextPhoto');
  var currentPhotoIndex = 0;
  
  // Convert NodeList to Array for easier handling
  var photoArray = Array.from(photos);
  
  // Add click event to each photo
  photos.forEach(function(photo, index) {
    photo.addEventListener('click', function() {
      currentPhotoIndex = index;
      openPhotoModal(photo.src, photo.alt);
    });
  });
  
  // Close modal events
  closeBtn.addEventListener('click', closePhotoModal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closePhotoModal();
    }
  });
  
  // Navigation events
  prevBtn.addEventListener('click', function() {
    if (currentPhotoIndex > 0) {
      currentPhotoIndex--;
      updateModalPhoto();
    }
  });
  
  nextBtn.addEventListener('click', function() {
    if (currentPhotoIndex < photoArray.length - 1) {
      currentPhotoIndex++;
      updateModalPhoto();
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (modal.style.display === 'block') {
      if (e.key === 'Escape') {
        closePhotoModal();
      } else if (e.key === 'ArrowLeft' && currentPhotoIndex > 0) {
        currentPhotoIndex--;
        updateModalPhoto();
      } else if (e.key === 'ArrowRight' && currentPhotoIndex < photoArray.length - 1) {
        currentPhotoIndex++;
        updateModalPhoto();
      }
    }
  });
  
  function openPhotoModal(src, alt) {
    modalImage.src = src;
    modalImage.alt = alt;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    updateNavigationButtons();
  }
  
  function closePhotoModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
  }
  
  function updateModalPhoto() {
    var currentPhoto = photoArray[currentPhotoIndex];
    modalImage.src = currentPhoto.src;
    modalImage.alt = currentPhoto.alt;
    updateNavigationButtons();
  }
  
  function updateNavigationButtons() {
    prevBtn.disabled = currentPhotoIndex === 0;
    nextBtn.disabled = currentPhotoIndex === photoArray.length - 1;
  }
}

