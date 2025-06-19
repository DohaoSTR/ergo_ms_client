<script setup>
 import { ref, computed } from 'vue'
 import { useRoute } from 'vue-router'
 
 const props = defineProps({
   data: { type: Array, default: () => [] },
 })
 
 const route = useRoute()
 const scrollContainer = ref(null)
 const isScrolledToEnd = ref(false)
 const isScrolledToStart = ref(true)
 
 const shouldShowNavigation = computed(() => {
   return route.name === 'Projects'||route.name==='PersonalProjects'||route.name==='InvitedProjects'||route.name==='Maps'
 })
 
 const handleScroll = (event) => {
   const container = event.target
   const scrollLeft = container.scrollLeft
   const scrollWidth = container.scrollWidth
   const clientWidth = container.clientWidth
 
   isScrolledToEnd.value = scrollLeft + clientWidth >= scrollWidth - 0.4
   isScrolledToStart.value = scrollLeft <= 0.4
 }
 </script>
 
 <template>
   <div
     class="navbar-scroll"
     :class="{ 
       scrolledToEnd: isScrolledToEnd, 
       scrolledToStart: isScrolledToStart,
       'd-none': !shouldShowNavigation
     }"
   >
     <div 
       class="navbar-scroll-wrapper py-1" 
       ref="scrollContainer" 
       @scroll="handleScroll"
     >
       <ul class="navbar-nav flex-row gap-1">
         <li 
           v-for="(item, index) in props.data" 
           :key="index" 
           class="nav-item"
         >
           <RouterLink
             :to="{ name: item.link }"
             class="btn fw-bold text-center"
             active-class="btn-primary"
           >
             <div class="d-flex align-items-center justify-content-center gap-1">
               <div class="icon-flex">
                 <component v-if="item.icon" :is="item.icon" :size="20" />
               </div>
               <div class="fw-bold">{{ item.title }}</div>
             </div>
           </RouterLink>
         </li>
       </ul>
     </div>
   </div>
 </template>
 
 <style scoped lang="scss">
 li {
   cursor: pointer;
 
   a:not(.btn-primary):hover {
     background-color: var(--bs-primary-bg-subtle);
     color: var(--bs-primary);
   }
 }
 
 .navbar-scroll {
   position: relative;
   flex-grow: 1;
 
   &::after {
     content: '';
     position: absolute;
     z-index: 1;
     top: 0;
     right: 0;
     width: 15%;
     height: 100%;
     pointer-events: none;
     background: linear-gradient(to left, var(--bs-body-bg), transparent);
     transition: opacity $transition;
   }
   &::before {
     content: '';
     position: absolute;
     z-index: 1;
     top: 0;
     left: 0;
     width: 15%;
     height: 100%;
     pointer-events: none;
     background: linear-gradient(to right, var(--bs-body-bg), transparent);
     transition: opacity $transition;
   }
 
   ::-webkit-scrollbar {
     display: none;
   }
 }
 
 .navbar-scroll-wrapper {
   white-space: nowrap;
   overflow-x: scroll;
   overflow-y: hidden;
   position: relative;
   scrollbar-width: none;
 }
 
 .navbar-scroll.scrolledToEnd::after,
 .navbar-scroll.scrolledToStart::before {
   opacity: 0;
 }
 </style>