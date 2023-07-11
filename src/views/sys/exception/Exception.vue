<script lang="tsx">
import { computed, defineComponent, ref, unref } from 'vue'
import { ExceptionEnum } from '/@/enums/exceptionEnum'
import { useRoute } from 'vue-router'
import { useGo } from '/@/hooks/web/usePage'
import { Button, Result } from 'ant-design-vue'
import { useDesign } from '/@/hooks/web/useDesign'

interface MapValue {
  title: string
  subTitle: string
  btnText?: string
  icon?: string
  handler?: any
  status?: string
}

export default defineComponent({
  name: 'ErrorPage',
  props: {
    status: {
      type: Number as PropType<number>,
      default: ExceptionEnum.PAGE_NOT_FOUND,
    },
    title: {
      type: String as PropType<string>,
      default: '',
    },
    subTitle: {
      type: String as PropType<string>,
      default: '',
    },
    full: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
  },
  setup(props) {
    const statusMapRef = ref(new Map<string | number, MapValue>())
    const { query } = useRoute()
    const go = useGo()
    const { prefixCls } = useDesign('app-exception-page')

    const getStatus = computed(() => {
      const { status: routeStatus } = query
      const { status } = props
      return Number(routeStatus) || status
    })

    const getMapValue = computed((): MapValue => {
      return unref(statusMapRef).get(unref(getStatus)) as MapValue
    })

    const backHome = '返回首页'

    unref(statusMapRef).set(ExceptionEnum.PAGE_NOT_FOUND, {
      title: '404',
      status: `${ExceptionEnum.PAGE_NOT_FOUND}`,
      subTitle: '抱歉，您访问的页面不存在。',
      btnText: backHome,
      handler: () => go(),
    })

    return () => {
      const { title, subTitle, btnText, icon, handler, status } = unref(getMapValue) || {}
      return (
        <Result
          class={prefixCls}
          status={status as any}
          title={props.title || title}
          sub-title={props.subTitle || subTitle}
        >
          {{
            extra: () =>
              btnText && (
                <Button type="primary" onClick={handler}>
                  {() => btnText}
                </Button>
              ),
            icon: () => (icon ? <img src={icon} /> : null),
          }}
        </Result>
      )
    }
  },
})
</script>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-app-exception-page';

.@{prefix-cls} {
  display: flex;
  flex-direction: column;
  align-items: center;

  .ant-result-icon {
    img {
      max-width: 400px;
      max-height: 300px;
    }
  }
}
</style>
