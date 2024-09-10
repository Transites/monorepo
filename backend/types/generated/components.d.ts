import type { Schema, Attribute } from '@strapi/strapi';

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

export interface OtherPlaceAndDate extends Schema.Component {
  collectionName: 'components_other_place_and_dates';
  info: {
    displayName: 'Place and Date';
    icon: 'attachment';
    description: '';
  };
  attributes: {
    place: Attribute.String;
  };
}

export interface OtherEventos extends Schema.Component {
  collectionName: 'components_other_eventos';
  info: {
    displayName: 'Eventos';
    icon: 'bulletList';
    description: '';
  };
  attributes: {
    local: Attribute.String;
  };
}

export interface DataLocalDeath extends Schema.Component {
  collectionName: 'components_data_local_deaths';
  info: {
    displayName: 'death';
  };
  attributes: {
    data: Attribute.Date;
    local: Attribute.String;
  };
}

export interface DataLocalBirth extends Schema.Component {
  collectionName: 'components_data_local_births';
  info: {
    displayName: 'birth';
  };
  attributes: {
    data: Attribute.Date;
    local: Attribute.String;
  };
}

export interface PublicationPublication extends Schema.Component {
  collectionName: 'components_publication_publications';
  info: {
    displayName: 'Publication';
    description: '';
  };
  attributes: {
    Location: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'section.strict-text-section': SectionStrictTextSection;
      'section.free-text-section': SectionFreeTextSection;
      'other.place-and-date': OtherPlaceAndDate;
      'other.eventos': OtherEventos;
      'data-local.death': DataLocalDeath;
      'data-local.birth': DataLocalBirth;
      'publication.publication': PublicationPublication;
    }
  }
}
