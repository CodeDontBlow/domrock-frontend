import { createRouter, createWebHistory } from 'vue-router'
import SidebarLayout from '../layouts/SidebarLayout.vue'
import AuditoriaPage from '../(user)/auditoria/Page.vue'
import { lerPerfil, rotaInicial } from '@/composables/usePerfil'
import ChatPage from '../(user)/chat/Page.vue'
import LoginPage from '../(auth)/login/Page.vue'
import AdminUsers from '../(admin)/users/Page.vue'
import CampanhaPage from '../(user)/campanha/Page.vue'
import CampanhasPage from '../(user)/campanhas/Page.vue'
import CampanhaDetalhePage from '../(user)/campanhas/[id]/Page.vue'
import SolicitacoesPage from '../(user)/solicitacoes/Page.vue'
import ConfiguracoesPage from '../(user)/configuracoes/Page.vue'
import ImportacaoPage from '../(user)/importacao/Page.vue'
import RelatorioImportacaoPage from '../(user)/importacao/relatorio/Page.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: SidebarLayout,
      children: [
        {
          path: 'auditoria',
          name: 'auditoria',
          component: AuditoriaPage,
          meta: { auditor: true },
        },
        {
          path: 'auditoria/campanhas/:id',
          name: 'auditoria-campanha',
          component: AuditoriaPage,
          meta: { auditor: true },
        },
        {
          path: '',
          name: 'chat',
          component: ChatPage,
        },
        {
          path: 'campanha',
          name: 'campanha',
          component: CampanhaPage,
        },
        {
          path: 'campanhas',
          name: 'campanhas',
          component: CampanhasPage,
        },
        {
          path: 'campanhas/:id',
          name: 'campanha-detalhe',
          component: CampanhaDetalhePage,
        },
        {
          path: 'solicitacoes',
          name: 'solicitacoes',
          component: SolicitacoesPage,
        },
        {
          path: 'configuracoes',
          name: 'configuracoes',
          component: ConfiguracoesPage,
        },
        {
          path: 'importar',
          name: 'importar',
          component: ImportacaoPage,
        },
        {
          path: 'importar/:id',
          name: 'importar-relatorio',
          component: RelatorioImportacaoPage,
        },
      ],
    },
    {
      path: '/admin',
      name: 'admin',
      component: SidebarLayout,
      children: [
        {
          path: '',
          name: 'users',
          component: AdminUsers,
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/:pathMatch(.*)',
      redirect: '/',
    },
  ],
})

// A proteção da API complementa estas regras de navegação.
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const perfil = lerPerfil()
  if (!token && to.name !== 'login') return { name: 'login' }
  if (!token) return
  if (to.name === 'login') return { name: rotaInicial(perfil) }
  if (perfil === 'AUDITOR' && !to.meta.auditor) return { name: 'auditoria' }
  if (to.meta.auditor && perfil !== 'AUDITOR') return { name: rotaInicial(perfil) }
  if (perfil !== 'ADMIN' && to.path.startsWith('/admin')) return { name: rotaInicial(perfil) }
  if (perfil !== 'SUPERVISOR' && to.path.startsWith('/importar'))
    return { name: rotaInicial(perfil) }
  if (perfil === 'ADMIN' && to.path === '/') return { name: 'users' }
})

export default router
