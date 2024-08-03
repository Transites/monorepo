import type { Schema, Attribute } from '@strapi/strapi';

export interface OtherPlaceAndDate extends Schema.Component {
  collectionName: 'components_other_place_and_dates';
  info: {
    displayName: 'Place and Date';
    icon: 'attachment';
  };
  attributes: {
    place: Attribute.String;
    date: Attribute.Date;
  };
}

export interface PublicationPublication extends Schema.Component {
  collectionName: 'components_publication_publications';
  info: {
    displayName: 'Publication';
  };
  attributes: {
    Date: Attribute.Date;
    Location: Attribute.String;
  };
}

export interface SectionFreeTextSection extends Schema.Component {
  collectionName: 'components_section_free_text_sections';
  info: {
    displayName: 'Generic Text Section';
    icon: 'bulletList';
    description: '';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    content: Attribute.RichText & Attribute.Required;
  };
}

export interface SectionStrictTextSection extends Schema.Component {
  collectionName: 'components_section_strict_text_sections';
  info: {
    displayName: 'Default Text Section';
    icon: 'layer';
    description: '';
  };
  attributes: {
    title: Attribute.Enumeration<
      [
        'Publica\u00E7\u00F5es',
        'Bibliografia',
        'Artigo',
        'Premia\u00E7\u00F5es'
      ]
    > &
      Attribute.Required;
    content: Attribute.RichText & Attribute.Required;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'other.place-and-date': OtherPlaceAndDate;
      'publication.publication': PublicationPublication;
      'section.free-text-section': SectionFreeTextSection;
      'section.strict-text-section': SectionStrictTextSection;
    }
  }
}
