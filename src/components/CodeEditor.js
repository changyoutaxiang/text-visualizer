// 懒加载CodeMirror依赖 - 性能优化
let EditorView, basicSetup, html, xml, oneDark;
let codeMirrorLoaded = false;

async function loadCodeMirror() {
    if (codeMirrorLoaded) return;
    
    console.log('🔄 正在加载代码编辑器...');
    
    // 动态导入CodeMirror依赖
    const [
        { EditorView: EditorViewClass, basicSetup: basicSetupFunc },
        { html: htmlLang },
        { xml: xmlLang },
        { oneDark: oneDarkTheme }
    ] = await Promise.all([
        import('codemirror'),
        import('@codemirror/lang-html'),
        import('@codemirror/lang-xml'),
        import('@codemirror/theme-one-dark')
    ]);
    
    EditorView = EditorViewClass;
    basicSetup = basicSetupFunc;
    html = htmlLang;
    xml = xmlLang;
    oneDark = oneDarkTheme;
    
    codeMirrorLoaded = true;
    console.log('✅ 代码编辑器加载完成');
}

export class CodeEditor {
    constructor() {
        this.container = document.getElementById('editorContainer');
        this.editor = null;
        this.currentFormat = 'svg';
        this.isLoading = false;
    }

    async open(initialCode = '', format = 'svg') {
        this.currentFormat = format;
        
        // 显示加载状态
        this.showLoadingState();
        
        try {
            // 懒加载CodeMirror
            await loadCodeMirror();
            
            // 创建编辑器
            await this.createEditor(initialCode);
            this.setupEventListeners();
            
        } catch (error) {
            console.error('❌ 代码编辑器加载失败:', error);
            this.showErrorState();
        }
    }

    async createEditor(initialCode) {
        if (this.editor) {
            this.editor.destroy();
        }

        // 确保CodeMirror已加载
        if (!codeMirrorLoaded) {
            throw new Error('CodeMirror未加载');
        }

        const lang = this.currentFormat === 'svg' ? xml() : html();
        
        this.editor = new EditorView({
            doc: initialCode,
            extensions: [
                basicSetup,
                lang,
                oneDark,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        this.onCodeChange(update.state.doc.toString());
                    }
                })
            ],
            parent: this.container
        });

        this.container.style.height = '500px';
        this.container.style.border = '1px solid #444';
        this.container.style.borderRadius = '8px';
        
        // 清除加载状态
        this.clearLoadingState();
    }

    showLoadingState() {
        this.container.innerHTML = `
            <div class="editor-loading" style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 200px;
                background: #1e1e1e;
                border-radius: 8px;
                color: #ffffff;
                font-family: var(--font-sans);
            ">
                <div style="text-align: center;">
                    <div class="loading-spinner" style="
                        width: 24px;
                        height: 24px;
                        border: 2px solid #333;
                        border-top: 2px solid #3b82f6;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 12px;
                    "></div>
                    <div>正在加载代码编辑器...</div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    showErrorState() {
        this.container.innerHTML = `
            <div class="editor-error" style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 200px;
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                color: #dc2626;
                font-family: var(--font-sans);
            ">
                <div style="text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
                    <div>代码编辑器加载失败</div>
                    <button onclick="this.parentElement.parentElement.parentElement.innerHTML=''" 
                            style="
                                margin-top: 12px;
                                padding: 6px 12px;
                                background: #dc2626;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                            ">关闭</button>
                </div>
            </div>
        `;
    }

    clearLoadingState() {
        const loadingElement = this.container.querySelector('.editor-loading, .editor-error');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCode();
            }
        });
    }

    onCodeChange(newCode) {
        this.updatePreview(newCode);
        this.saveToHistory(newCode);
    }

    updatePreview(newCode) {
        const previewPanel = window.app.previewPanel;
        if (previewPanel) {
            previewPanel.displayResult(newCode, this.currentFormat);
        }
    }

    saveCode() {
        const code = this.getCode();
        const blob = new Blob([code], { type: this.currentFormat === 'svg' ? 'image/svg+xml' : 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `visualization.${this.currentFormat}`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('💾 代码已保存');
    }

    saveToHistory(code) {
        const history = this.loadHistory();
        history.unshift({
            code,
            format: this.currentFormat,
            timestamp: Date.now()
        });

        if (history.length > 50) {
            history.splice(50);
        }

        localStorage.setItem('code_history', JSON.stringify(history));
    }

    loadHistory() {
        const saved = localStorage.getItem('code_history');
        return saved ? JSON.parse(saved) : [];
    }

    getCode() {
        return this.editor ? this.editor.state.doc.toString() : '';
    }

    setCode(code) {
        if (this.editor) {
            const transaction = this.editor.state.update({
                changes: {
                    from: 0,
                    to: this.editor.state.doc.length,
                    insert: code
                }
            });
            this.editor.dispatch(transaction);
        }
    }

    formatCode() {
        if (!this.editor) return;

        const code = this.getCode();
        let formatted;

        try {
            if (this.currentFormat === 'svg') {
                formatted = this.formatSVG(code);
            } else {
                formatted = this.formatHTML(code);
            }
            
            this.setCode(formatted);
        } catch (error) {
            console.warn('格式化失败:', error);
        }
    }

    formatSVG(svg) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const serializer = new XMLSerializer();
        
        return serializer.serializeToString(doc);
    }

    formatHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        
        return div.innerHTML.replace(/\u003e\s+\u003c/g, '\u003e\u003c');
    }

    undo() {
        if (this.editor) {
            this.editor.dispatch({
                effects: EditorView.undo
            });
        }
    }

    redo() {
        if (this.editor) {
            this.editor.dispatch({
                effects: EditorView.redo
            });
        }
    }

    close() {
        if (this.editor) {
            this.editor.destroy();
            this.editor = null;
        }
        
        this.container.innerHTML = '';
        this.container.style.height = '';
        this.container.style.border = '';
    }

    getEditorState() {
        return {
            code: this.getCode(),
            format: this.currentFormat,
            hasChanges: this.hasChanged()
        };
    }

    hasChanged() {
        const currentCode = this.getCode();
        const originalCode = this.originalCode || '';
        return currentCode !== originalCode;
    }

    setOriginalCode(code) {
        this.originalCode = code;
    }
}