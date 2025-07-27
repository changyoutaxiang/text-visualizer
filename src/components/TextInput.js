export class TextInput {
    constructor() {
        this.element = document.getElementById('textInput');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.element.addEventListener('input', () => {
            this.updateCharacterCount();
        });

        this.element.addEventListener('paste', (e) => {
            setTimeout(() => this.updateCharacterCount(), 0);
        });
    }

    getValue() {
        return this.element.value;
    }

    setValue(text) {
        this.element.value = text;
        this.updateCharacterCount();
    }

    clear() {
        this.element.value = '';
        this.updateCharacterCount();
    }

    updateCharacterCount() {
        const count = this.element.value.length;
        let counter = document.querySelector('.char-count');
        
        if (!counter) {
            counter = document.createElement('div');
            counter.className = 'char-count';
            this.element.parentNode.insertBefore(counter, this.element.nextSibling);
        }
        
        counter.textContent = `${count} 字符`;
        counter.classList.toggle('warning', count > 2000);
    }

    validate() {
        const text = this.getValue().trim();
        if (!text) {
            this.element.classList.add('error');
            return false;
        }
        
        this.element.classList.remove('error');
        return true;
    }

    focus() {
        this.element.focus();
    }
}