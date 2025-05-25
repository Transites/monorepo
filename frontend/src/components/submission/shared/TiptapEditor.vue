<template>
  <div class="tiptap-editor">
    <div class="editor-toolbar">
      <v-btn-group variant="outlined">
        <v-btn icon @click="editor?.chain().focus().toggleBold().run()" :class="{ 'active': editor?.isActive('bold') }">
          <v-icon>mdi-format-bold</v-icon>
        </v-btn>
        <v-btn icon @click="editor?.chain().focus().toggleItalic().run()" :class="{ 'active': editor?.isActive('italic') }">
          <v-icon>mdi-format-italic</v-icon>
        </v-btn>
        <v-btn icon @click="editor?.chain().focus().toggleUnderline().run()" :class="{ 'active': editor?.isActive('underline') }">
          <v-icon>mdi-format-underline</v-icon>
        </v-btn>
      </v-btn-group>

      <v-btn-group variant="outlined" class="ml-2">
        <v-btn icon @click="editor?.chain().focus().setTextAlign('left').run()" :class="{ 'active': editor?.isActive({ textAlign: 'left' }) }">
          <v-icon>mdi-format-align-left</v-icon>
        </v-btn>
        <v-btn icon @click="editor?.chain().focus().setTextAlign('center').run()" :class="{ 'active': editor?.isActive({ textAlign: 'center' }) }">
          <v-icon>mdi-format-align-center</v-icon>
        </v-btn>
        <v-btn icon @click="editor?.chain().focus().setTextAlign('right').run()" :class="{ 'active': editor?.isActive({ textAlign: 'right' }) }">
          <v-icon>mdi-format-align-right</v-icon>
        </v-btn>
      </v-btn-group>

      <v-btn-group variant="outlined" class="ml-2">
        <v-btn icon @click="editor?.chain().focus().toggleBulletList().run()" :class="{ 'active': editor?.isActive('bulletList') }">
          <v-icon>mdi-format-list-bulleted</v-icon>
        </v-btn>
        <v-btn icon @click="editor?.chain().focus().toggleOrderedList().run()" :class="{ 'active': editor?.isActive('orderedList') }">
          <v-icon>mdi-format-list-numbered</v-icon>
        </v-btn>
      </v-btn-group>

      <v-btn-group variant="outlined" class="ml-2">
        <v-btn icon @click="showLinkDialog">
          <v-icon>mdi-link</v-icon>
        </v-btn>
      </v-btn-group>
    </div>

    <editor-content v-if="editor" :editor="editor" class="editor-content" />
    <div v-else class="editor-content loading">{{ $t('common.loading') }}</div>

    <div class="editor-footer">
      <div class="character-count" :class="{ 'warning': characterCount > characterWarningThreshold }">
        {{ $t('submission.editor.characterCount', { count: characterCount }) }}
      </div>
      <div v-if="validationErrors.length > 0" class="validation-errors">
        <div v-for="(error, index) in validationErrors" :key="index" class="error-message">
          <v-icon color="error" size="small">mdi-alert-circle</v-icon>
          {{ error }}
        </div>
      </div>
    </div>

    <!-- Link Dialog -->
    <v-dialog v-model="linkDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ $t('submission.editor.link') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="linkUrl"
            :label="$t('submission.editor.link')"
            :placeholder="$t('submission.editor.linkUrlPlaceholder')"
            :hint="$t('submission.editor.linkHint')"
            persistent-hint
          ></v-text-field>
          <v-text-field
            v-model="linkText"
            :label="$t('submission.editor.linkText')"
            :placeholder="$t('submission.editor.linkTextPlaceholder')"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="linkDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="var(--transites-gray-purple)" @click="insertLink">{{ $t('common.insert') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'

export default {
  name: 'TiptapEditor',
  components: {
    EditorContent,
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Comece a escrever aqui...'
    },
    characterWarningThreshold: {
      type: Number,
      default: 5000
    },
    maxCharacters: {
      type: Number,
      default: 10000
    }
  },
  data() {
    return {
      editor: null,
      characterCount: 0,
      validationErrors: [],
      linkDialog: false,
      linkUrl: '',
      linkText: '',
      selectedText: '',
      content: ''
    }
  },
  mounted() {
    // Set initial content from props
    this.content = this.modelValue || this.value || ''

    // Initialize the editor
    this.initEditor()
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy()
    }
  },
  watch: {
    modelValue(newValue) {
      // Only update the editor content if it's different from the current content
      // and if the editor is initialized
      if (this.editor && newValue !== this.content) {
        this.content = newValue
        this.editor.commands.setContent(newValue, false)
        this.updateCharacterCount()
      }
    },
    value(newValue) {
      // For backward compatibility
      if (this.editor && newValue !== this.content) {
        this.content = newValue
        this.editor.commands.setContent(newValue, false)
        this.updateCharacterCount()
      }
    }
  },
  methods: {
    initEditor() {
      this.editor = new Editor({
        extensions: [
          StarterKit,
          Underline,
          Link.configure({
            openOnClick: false,
            HTMLAttributes: {
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          }),
          TextAlign.configure({
            types: ['heading', 'paragraph'],
          }),
          Placeholder.configure({
            placeholder: this.placeholder || this.$t('submission.editor.placeholder'),
          }),
        ],
        content: this.content,
        onUpdate: ({ editor }) => {
          // Get HTML content and update model
          const newContent = editor.getHTML()
          this.content = newContent
          this.$emit('update:modelValue', newContent)
          this.$emit('input', newContent)
          this.updateCharacterCount()
          this.validateContent()
        },
        onSelectionUpdate: ({ editor }) => {
          // Store selected text for link creation
          this.selectedText = editor.state.selection.empty 
            ? '' 
            : editor.state.doc.textBetween(
                editor.state.selection.from, 
                editor.state.selection.to,
                ' '
              )
        }
      })

      this.updateCharacterCount()
    },
    updateCharacterCount() {
      if (!this.editor) return

      // Get text content without HTML tags
      const textContent = this.editor.state.doc.textContent
      this.characterCount = textContent.length

      // Validate character count
      const characterLimitError = this.$t('submission.editor.characterLimit', { limit: this.maxCharacters });
      if (this.characterCount > this.maxCharacters) {
        this.addValidationError(characterLimitError)
      } else {
        this.removeValidationError(characterLimitError)
      }
    },
    showLinkDialog() {
      if (!this.editor) return

      this.linkText = this.selectedText
      this.linkUrl = ''
      this.linkDialog = true
    },
    insertLink() {
      if (!this.editor || !this.linkUrl) {
        return
      }

      // If there's no selected text but link text is provided, insert it first
      if (!this.selectedText && this.linkText) {
        this.editor
          .chain()
          .focus()
          .insertContent(this.linkText)
          .setTextSelection({
            from: this.editor.state.selection.from - this.linkText.length,
            to: this.editor.state.selection.from
          })
          .run()
      }

      // Set the link
      this.editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: this.linkUrl, target: '_blank' })
        .run()

      // Reset and close dialog
      this.linkUrl = ''
      this.linkText = ''
      this.linkDialog = false
    },
    validateContent() {
      if (!this.editor) return

      // Reset validation errors related to content
      this.validationErrors = this.validationErrors.filter(error => 
        !error.includes('parágrafos') && !error.includes('limite')
      )

      // Example: Check for very long paragraphs
      const longParagraphFound = Array.from(this.editor.state.doc.content.content)
        .some(node => node.type.name === 'paragraph' && node.textContent.length > 800)

      if (longParagraphFound) {
        this.addValidationError(this.$t('submission.editor.longParagraphError'))
      }

      // Check character count
      this.updateCharacterCount()

      // Emit updated validation errors
      this.$emit('validation', this.validationErrors)
    },
    addValidationError(error) {
      if (!this.validationErrors.includes(error)) {
        this.validationErrors.push(error)
      }
      this.$emit('validation', this.validationErrors)
    },
    removeValidationError(error) {
      const index = this.validationErrors.indexOf(error)
      if (index !== -1) {
        this.validationErrors.splice(index, 1)
      }
      this.$emit('validation', this.validationErrors)
    }
  }
}
</script>

<style scoped>
.tiptap-editor {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  padding: 8px;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
  display: flex;
  flex-wrap: wrap;
}

.editor-content {
  min-height: 200px;
  padding: 12px;
  overflow-y: auto;
}

.editor-content.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

:deep(.ProseMirror) {
  outline: none;
  min-height: 200px;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #aaa;
  pointer-events: none;
  height: 0;
}

.editor-footer {
  padding: 8px;
  border-top: 1px solid #eee;
  background-color: #f9f9f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.character-count {
  font-size: 0.8rem;
  color: #666;
}

.character-count.warning {
  color: orange;
}

.validation-errors {
  font-size: 0.8rem;
}

.error-message {
  color: #ff5252;
  display: flex;
  align-items: center;
  gap: 4px;
}

.active {
  background-color: rgba(var(--transites-gray-purple-rgb), 0.1);
}
</style>
