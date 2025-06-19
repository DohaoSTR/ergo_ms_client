<template>
    <div class="video-container" >
      <video controls >
        <source src="./test-video.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <div class="watermark">{{ user }}</div>
    </div>
  </template>
  
  
  <style scoped>
  .video-container {
    position: relative;
    width: 100%;
    margin: auto;
  }
  video::-webkit-media-controls-fullscreen-button {
  display: none;
}
  
  .video-container video {
    width: 100%;
    height: auto;
  }
  
  .watermark {
    position: absolute;
    top: 10px;
    left: 10px;
    opacity: 0.5;
    font-size: 36px;
    color: white;
    text-shadow: 1px 1px 2px black;
    user-select: none;
  }
  </style>

<script setup>
import { ref, onMounted } from 'vue';
import { CheckAccess} from '@/js/api/services/cms';
const user = ref('');

const props = defineProps({
    vid: {
        type: String,
        required: true
    }
});

onMounted(async () => {
    const response = await CheckAccess.GetUserName();
    user.value = response.data;
});
</script>
  