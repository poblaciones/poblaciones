import Vue from 'vue';
import Router from 'vue-router';

// in development-env not use lazy-loading, because lazy-loading too many pages will cause webpack hot update too slow. so only in production use lazy-loading;
// detail: https://panjiachen.github.io/vue-element-admin-site/#/lazy-loading

Vue.use(Router);

/**
* hidden: true                   if `hidden:true` will not show in the sidebar(default is false)
* alwaysVisible: true               if set true, will always show the root menu, whatever its child routes length
*                                if not set alwaysVisible, only more than one route under the children
*                                it will becomes nested mode, otherwise not show the root menu
* redirect: noredirect           if `redirect:noredirect` will no redirct in the breadcrumb
* name:'router-name'             the name is used by <keep-alive> (must set!!!)
* meta : {
		title: 'title'               the name show in submenu and breadcrumb (recommend set)
		icon: 'svg-name'             the icon show in the sidebar,
	}
**/
export const constantRouterMap = [
//	{ path: '/login', component: () => import('@/backoffice/views/login/index'), hidden: true },
{ path: '/404', component: () => import('@/backoffice/views/404'), hidden: true },
	{
		path: '',
		redirect: '/signin', // default child path
	},
	{
		path: '/signin',
		name: 'Ingresar',
		meta: { title: 'Ingresar' },
		hidden: false,
		component: () => import('@/credentials/views/Login.vue'),
	},
	{
		path: '/newPassword',
		name: 'ChangePassword',
		hidden: false,
		meta: { title: 'Restablecer contraseña' },
		component: () => import('@/credentials/views/NewPassword.vue'),
	},
	{
		path: '/activate',
		name: 'Activar',
		meta: { title: 'Activar cuenta' },
		hidden: false,
		component: () => import('@/credentials/views/Activate.vue'),
	},
	{
		path: '/recover',
		name: 'Recuperar',
		hidden: false,
		meta: { title: 'Restablecer contraseña' },
		component: () => import('@/credentials/views/Recover.vue'),
	},
	{
		path: '/signup',
		name: 'Empezar',
		hidden: false,
		meta: { title: 'Crear cuenta' },
		component: () => import('@/credentials/views/Signup.vue'),
	},
	{ path: '*', redirect: '/40455', hidden: true }
];

export default new Router({
	// mode: 'history',
	scrollBehavior: () => ({ y: 0 }),
	routes: constantRouterMap
});

