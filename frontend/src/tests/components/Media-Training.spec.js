import { mount } from '@vue/test-utils';
import { describe, expect, it } from "vitest";
import Media from "@/components/Media.vue";

describe('Media.vue', () => {
    it('renders the component', () => {
        const wrapper = mount(Media, {
            global: {
                stubs: {
                    'v-container': {
                        template: '<div><slot /></div>'
                    },
                    'v-row': {
                        template: '<div><slot /></div>'
                    },
                    'v-col': {
                        template: '<div class="v-col-media-stub"><slot /></div>'
                    },
                }
            }
        });

        expect(wrapper.exists()).toBe(true);
        // reference internal media's data: videoIds array and check if the number of columns of vcol is equal to the number of videos
        const videoIds = wrapper.vm.$data.videoIds;
        const vCol = wrapper.findAll('.v-col-media-stub');
        expect(vCol.length).toBe(videoIds.length);

        // check if inside v-col items there's only an iframe
        vCol.forEach((col) => {
            const iframe = col.find('iframe');
            expect(iframe.exists()).toBe(true);
        });

    });
})