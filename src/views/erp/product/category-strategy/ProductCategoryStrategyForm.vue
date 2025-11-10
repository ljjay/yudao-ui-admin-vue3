<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="产品分类" prop="pcId">
        <el-tree-select
          v-model="formData.pcId"
          :data="productCategoryTreeData"
          :props="defaultProps"
          :render-after-expand="false"
          node-key="id"
          check-strictly
          clearable
          filterable
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="部门" prop="deptId">
        <el-tree-select
          v-model="formData.deptId"
          :data="deptTreeData"
          :props="deptProps"
          :render-after-expand="false"
          node-key="id"
          check-strictly
          clearable
          filterable
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="管理类型" prop="manageType">
        <el-select v-model="formData.manageType" placeholder="请选择管理类型" filterable style="width: 100%">
          <el-option
            v-for="dict in filteredManageTypeOptions"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { ProductCategoryStrategyApi, ProductCategoryStrategyVO } from '@/api/erp/product/category-strategy'
import {ProductCategoryApi, ProductCategoryVO} from '@/api/erp/product/category'
import * as DeptApi from '@/api/system/dept'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { handleTree } from '@/utils/tree'

/** ERP 产品分类管理策略 表单 */
defineOptions({ name: 'ProductCategoryStrategyForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  pcId: undefined,
  deptId: undefined,
  manageType: undefined
})
const formRules = reactive({
  pcId: [{ required: true, message: '产品分类不能为空', trigger: 'change' }],
  deptId: [{ required: true, message: '部门不能为空', trigger: 'change' }],
  manageType: [{ required: true, message: '管理类型不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

// 产品分类和部门树相关
const productCategoryTreeData = ref<ProductCategoryVO[]>([]) // 产品分类列表
const deptTreeData = ref<any[]>([]) // 部门树形结构
const defaultProps = {
  children: 'children',
  label: 'name',
  disabled: (data) => data.coerceManageType !== 1
}
const deptProps = {
  children: 'children',
  label: 'name',
}
const allManageTypeOptions = getIntDictOptions(DICT_TYPE.ERP_PRODUCT_CATEGORY_MANAGEMENT_TYPE)
const categoryManageType = ref<number>()
const productCategoryMap = ref<Map<number, ProductCategoryVO>>(new Map())
const filteredManageTypeOptions = computed(() => {
  if (!categoryManageType.value) {
    return allManageTypeOptions
  }
  return allManageTypeOptions.filter((option) => option.value >= categoryManageType.value!)
})

const syncCategoryManageType = (pcId?: number) => {
  if (!pcId) {
    categoryManageType.value = undefined
    return
  }
  const category = productCategoryMap.value.get(pcId)
  categoryManageType.value = category?.manageType
}

watch(
  () => formData.value.pcId,
  (pcId) => {
    syncCategoryManageType(pcId)
  }
)

watch(
  () => categoryManageType.value,
  (manageType) => {
    if (!manageType) {
      return
    }
    const currentManageType = formData.value.manageType
    if (!currentManageType || currentManageType < manageType) {
      formData.value.manageType = manageType
    }
  }
)

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()

  await Promise.all([
    getProductCategoryTree(),
    getDeptTree()
  ])

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await ProductCategoryStrategyApi.getProductCategoryStrategy(id)
      formData.value = {
        id: data.id,
        pcId: data.pcId,
        deptId: data.deptId,
        manageType: data.manageType
      }
    } finally {
      formLoading.value = false
    }
  }
  syncCategoryManageType(formData.value.pcId)
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProductCategoryStrategyVO
    if (formType.value === 'create') {
      await ProductCategoryStrategyApi.createProductCategoryStrategy(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProductCategoryStrategyApi.updateProductCategoryStrategy(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    pcId: undefined,
    deptId: undefined,
    manageType: undefined
  }
  formRef.value?.resetFields()
}

/** 获得产品分类树 */
const getProductCategoryTree = async () => {
  try {
    const data = await ProductCategoryApi.getProductCategorySimpleList()
    productCategoryMap.value = new Map(data.map((item: ProductCategoryVO) => [item.id, item]))
    productCategoryTreeData.value = handleTree(data, 'id', 'parentId')
  } catch (error) {
    console.error('获取产品分类树失败:', error)
  }
}

/** 获得部门树 */
const getDeptTree = async () => {
  try {
    const data = await DeptApi.getSimpleDeptList()
    deptTreeData.value = handleTree(data)
  } catch (error) {
    console.error('获取部门树失败:', error)
  }
}
</script>
