import { DeepReadonly } from 'vue';

// Define the structure of our translation messages
export type MessageSchema = DeepReadonly<{
  navbar: {
    home: string;
    about: string;
    contribute: string;
    search: {
      placeholder: string;
      button: string;
      noResults: string;
      results: string;
    };
  };
  common: {
    loading: string;
    error: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    insert: string;
    submit: string;
    back: string;
    next: string;
    previous: string;
    required: string;
    optional: string;
    yes: string;
    no: string;
    close: string;
    confirm: string;
    success: string;
    failure: string;
    here: string;
  };
  submission: {
    title: string;
    steps: {
      basicInfo: string;
      content: string;
      media: string;
      bibliography: string;
      preview: string;
    };
    form: {
      title: string;
      abstract: string;
      keywords: string;
      addKeyword: string;
      content: string;
      images: string;
      mainImage: string;
      additionalImages: string;
      bibliography: string;
      preview: string;
      submit: string;
      save: string;
      cancel: string;
    };
    validation: {
      required: string;
      minLength: string;
      maxLength: string;
      invalidFormat: string;
    };
    editor: {
      placeholder: string;
      bold: string;
      italic: string;
      underline: string;
      strike: string;
      heading: string;
      bulletList: string;
      orderedList: string;
      link: string;
      linkText: string;
      linkTextPlaceholder: string;
      linkUrlPlaceholder: string;
      linkHint: string;
      image: string;
      undo: string;
      redo: string;
      characterCount: string;
      characterLimit: string;
      longParagraphError: string;
    };
    imageUploader: {
      dropzone: string;
      formats: string;
      browse: string;
      uploading: string;
      success: string;
      error: string;
      remove: string;
      selectedImages: string;
      title: string;
      titleRequired: string;
      caption: string;
      captionRequired: string;
      credits: string;
      creditsRequired: string;
      maxFilesError: string;
      invalidFileError: string;
      fileSizeError: string;
      incompleteMetadataError: string;
    };
  };
  article: {
    publishedOn: string;
    author: string;
    readMore: string;
    relatedArticles: string;
    share: string;
  };
  errors: {
    notFound: string;
    serverError: string;
    networkError: string;
    unauthorized: string;
    forbidden: string;
  };
  contribute: {
    title: string;
    subtitle1: string;
    subtitle2: string;
    subtitle3: string;
    form: {
      fullName: string;
      subject: string;
      message: string;
      send: string;
      required: string;
    };
  };
  about: {
    title: string;
    subtitle: string;
    projectName: string;
    description: string;
    feedbackTitle: string;
    feedbackText: string;
    feedbackThanks: string;
  };
  // Add more sections as needed
}>;

// Type for the messages object that will be passed to vue-i18n
export type Messages = {
  [locale: string]: MessageSchema;
};

// Type for the options object that will be passed to vue-i18n
export type I18nOptions = {
  locale: string;
  fallbackLocale: string;
  messages: Messages;
  legacy: boolean;
  globalInjection: boolean;
  silentTranslationWarn: boolean;
  silentFallbackWarn: boolean;
  missingWarn: boolean;
  fallbackWarn: boolean;
};
