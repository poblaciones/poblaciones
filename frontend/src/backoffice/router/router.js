import Vue from 'vue';
import Router from 'vue-router';

// in development-env not use lazy-loading, because lazy-loading too many pages will cause webpack hot update too slow. so only in production use lazy-loading;
// detail: https://panjiachen.github.io/vue-element-admin-site/#/lazy-loading

Vue.use(Router);

/* Layout */
import Layout from '../views/Layout/Layout.vue';

/**
* hidden: true                   if `hidden:true` will not show in the sidebar(default is false)
* alwaysShow: true               if set true, will always show the root menu, whatever its child routes length
*                                if not set alwaysShow, only more than one route under the children
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
	path: '/',
		alias: [ '/public' ],
		name: 'Inicio',
		hidden: true,
			component: () => import('@/backoffice/views/Home.vue'),
				meta: { title: 'Inicio', icon: 'form' }
},

{
	group: 'Metadatos',
	path: '/cartographies/:workId/content',
	alias: '/cartographies/:workId',
	component: Layout,
	redirect: '/cartographies/:workId/content',
	icon: 'fa fa-tag',
	name: 'Contenido',
	hidden: false,
	children: [
			{
				path: '/cartographies/:workId/content',
				name: 'Metadatos Target',
				component: () => import('@/backoffice/views/Metadata/Content.vue'),
			}
		]
	},

{
	group: 'Metadatos',
	path: '/cartographies/:workId/attribution',
	component: Layout,
	redirect: '/cartographies/:workId/attribution',
	icon: 'fab fa-creative-commons-by',
	name: 'Atribución',
	hidden: false,
	children: [
		{
			path: '/cartographies/:workId/attribution',
			name: 'Atributtion Target',
			component: () => import('@/backoffice/views/Metadata/Attribution.vue'),
		}
	]
},

{
group: 'Metadatos',
	path: '/cartographies/:workId/abstract',
			component: Layout,
				redirect: '/cartographies/:workId/abstract',
					icon: 'far fa-file-alt',
						name: 'Resumen',
								children: [
									{
										path: '/cartographies/:workId/abstract',
										name: 'Resumen Target',
										component: () => import('@/backoffice/views/Metadata/Abstract.vue'),
										meta: { title: 'Resumen', icon: 'table' }
			}
		]
	},

{
	group: 'Metadatos',
	path: '/cartographies/:workId/sources',
	component: Layout,
	redirect: '/cartographies/:workId/sources',
	icon: 'fas fa-quote-right',
	name: 'Fuentes secundarias',
	hidden: false,
	children: [
		{
			path: '/cartographies/:workId/sources',
			name: 'Sources Target',
			component: () => import('@/backoffice/views/Metadata/Sources.vue'),
			}
		]
	},


{
	group: 'Metadatos',
	path: '/cartographies/:workId/attachments',
	component: Layout,
	redirect: '/cartographies/:workId/attachments',
	icon: 'fas fa-paperclip',
	name: 'Adjuntos',
	hidden: false,
	children: [
		{
			path: '/cartographies/:workId/attachments',
			name: 'Attachments Target',
			component: () => import('@/backoffice/views/Metadata/Attachments.vue'),
		meta: { title: 'Adjuntos', icon: 'table' }
		}
	]
},

{
	group: 'Datasets',
		path: '/cartographies/:workId/newDataset',
			component: Layout,
				redirect: '/cartographies/:workId/newDataset',
					icon: 'fas fa-plus-circle',
						name: 'Nuevo dataset',
							children: [
								{
									path: '/cartographies/:workId/newDataset',
									name: 'NewDatasetTarget',
									component: () => import('@/backoffice/views/Dataset/NewDataset.vue')
			}
		]
},

{
	group: 'Datasets',
	path: '/cartographies/:workId',
		component: Layout,
			redirect: '/cartographies/:workId/table',
			name: 'Datasets',
			icon: 'fa fa-table',
			hidden: true,
			meta: { title: 'Datasets', icon: 'example' },
			children: [
			{
				hidden: true,
				path: 'datasets/:datasetId',
				alias: ['datasets/:datasetId/metrics', 'datasets/:datasetId/variables',
								'datasets/:datasetId/georeference', 'datasets/:datasetId/identity',
								'datasets/:datasetId/multilevel'],
				name: 'DatasetEdit',
				component: () => import('@/backoffice/views/Dataset/Dataset.vue')
			}
		],
		childrenExtraNodes: null
	},

	{
		group: 'Administración',
		path: '/cartographies/:workId/permissions',
		component: Layout,
		redirect: '/cartographies/:workId/permissions',
		icon: 'fa fa-user',
		name: 'Permisos',
		children: [
			{
				path: '/cartographies/:workId/permissions',
				name: 'PermisosTarget',
				component: () => import('@/backoffice/views/Permissions/Permissions.vue'),
			}
		]
	},

	{
		group: 'Administración',
		path: '/cartographies/:workId/visibility',
		component: Layout,
		redirect: '/cartographies/:workId/visibility',
		icon: 'far fa-eye',
		name: 'Visibilidad',
		children: [
			{
				path: '/cartographies/:workId/visibility',
				name: 'VisibilidadTarget',
				component: () => import('@/backoffice/views/Visibility/Visibility.vue'),
			}
		]
	},

	{
		group: 'Administración',
		path: '/cartographies/:workId/customize',
		component: Layout,
		redirect: '/cartographies/:workId/customize',
		icon: 'fas fa-sliders-h',
		name: 'Personalizar',
		children: [
			{
				path: '/cartographies/:workId/customize',
				name: 'CustomizeTarget',
				component: () => import('@/backoffice/views/Customize/Customize.vue'),
			}
		]
	},


	{ path: '*', redirect: '/404', hidden: true }
];

export default new Router({
	// mode: 'history',
	scrollBehavior: () => ({ y: 0 }),
	routes: constantRouterMap
});

