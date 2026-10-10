/**
 * LostLink - Client-side Form Validation Utility
 */

const validation = {
  // Validate email address
  isValidEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).trim());
  },

  // Mark input invalid with friendly message
  setInvalid(element, message) {
    if (!element) return false;
    element.classList.remove('is-valid');
    element.classList.add('is-invalid');
    
    let feedback = element.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      element.parentElement.appendChild(feedback);
    }
    feedback.textContent = message;
    return false;
  },

  // Mark input as valid
  setValid(element) {
    if (!element) return true;
    element.classList.remove('is-invalid');
    element.classList.add('is-valid');
    const feedback = element.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.textContent = '';
    }
    return true;
  },

  // Clear validation styling
  clearValidation(form) {
    if (!form) return;
    form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
      el.classList.remove('is-invalid', 'is-valid');
    });
    form.querySelectorAll('.invalid-feedback').forEach(el => {
      el.textContent = '';
    });
  },

  // Validate LoginForm
  validateLogin(form) {
    let isValid = true;
    const email = form.email;
    const password = form.password;

    if (!email.value.trim()) {
      isValid = this.setInvalid(email, "Please enter your email address.");
    } else if (!this.isValidEmail(email.value)) {
      isValid = this.setInvalid(email, "Please enter a valid college or personal email address.");
    } else {
      this.setValid(email);
    }

    if (!password.value) {
      isValid = this.setInvalid(password, "Please enter your account password.");
    } else if (password.value.length < 6) {
      isValid = this.setInvalid(password, "Password must be at least 6 characters.");
    } else {
      this.setValid(password);
    }

    return isValid;
  },

  // Validate RegisterForm
  validateRegister(form) {
    let isValid = true;
    const name = form.name;
    const email = form.email;
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!name.value.trim() || name.value.trim().length < 2) {
      isValid = this.setInvalid(name, "Full name must be at least 2 characters.");
    } else {
      this.setValid(name);
    }

    if (!email.value.trim()) {
      isValid = this.setInvalid(email, "Email address is required.");
    } else if (!this.isValidEmail(email.value)) {
      isValid = this.setInvalid(email, "Enter a valid email address (e.g. user@college.edu).");
    } else {
      this.setValid(email);
    }

    if (!password.value) {
      isValid = this.setInvalid(password, "Password is required.");
    } else if (password.value.length < 6) {
      isValid = this.setInvalid(password, "Password must be at least 6 characters long.");
    } else {
      this.setValid(password);
    }

    if (!confirmPassword.value) {
      isValid = this.setInvalid(confirmPassword, "Please re-type your password.");
    } else if (confirmPassword.value !== password.value) {
      isValid = this.setInvalid(confirmPassword, "Passwords do not match.");
    } else {
      this.setValid(confirmPassword);
    }

    return isValid;
  },

  // Validate Post Item Form (Lost or Found)
  validateItemForm(form) {
    let isValid = true;
    const title = form.title;
    const category = form.category;
    const date = form.date;
    const location = form.location;
    const description = form.description;
    const verificationQuestion = form.verificationQuestion;
    const verificationAnswer = form.verificationAnswer;

    if (!title.value.trim() || title.value.trim().length < 3) {
      isValid = this.setInvalid(title, "Item title must be at least 3 characters.");
    } else {
      this.setValid(title);
    }

    if (!category.value || category.value === "") {
      isValid = this.setInvalid(category, "Please select an item category.");
    } else {
      this.setValid(category);
    }

    if (!date.value) {
      isValid = this.setInvalid(date, "Please select the date.");
    } else {
      this.setValid(date);
    }

    if (!location.value.trim() || location.value.trim().length < 3) {
      isValid = this.setInvalid(location, "Please specify the campus location (e.g., Library 2nd floor).");
    } else {
      this.setValid(location);
    }

    if (!description.value.trim() || description.value.trim().length < 15) {
      isValid = this.setInvalid(description, "Please provide a helpful description (minimum 15 characters).");
    } else {
      this.setValid(description);
    }

    if (!verificationQuestion.value.trim() || verificationQuestion.value.trim().length < 5) {
      isValid = this.setInvalid(verificationQuestion, "Please write a private verification question.");
    } else {
      this.setValid(verificationQuestion);
    }

    if (!verificationAnswer.value.trim() || verificationAnswer.value.trim().length < 2) {
      isValid = this.setInvalid(verificationAnswer, "Please provide the private answer used to verify the rightful owner.");
    } else {
      this.setValid(verificationAnswer);
    }

    return isValid;
  },

  // Validate Claim Form
  validateClaimForm(form) {
    let isValid = true;
    const answer = form.answer;

    if (!answer.value.trim()) {
      isValid = this.setInvalid(answer, "You must provide an answer to the verification question.");
    } else if (answer.value.trim().length < 2) {
      isValid = this.setInvalid(answer, "Please provide a descriptive verification answer.");
    } else {
      this.setValid(answer);
    }

    return isValid;
  },

  // Validate Image File (size and format)
  validateImageFile(file) {
    if (!file) return { valid: true };
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, message: "Only JPG, PNG, and WebP images are allowed." };
    }
    if (file.size > maxSize) {
      return { valid: false, message: "Image file size must not exceed 5MB." };
    }
    return { valid: true };
  }
};
