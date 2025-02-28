<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1080">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
      :disabled="disabled"
    >
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="调度单号" prop="no">
            <el-input disabled v-model="formData.no" placeholder="保存时自动生成" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="调度时间" prop="moveTime">
            <el-date-picker
              v-model="formData.moveTime"
              type="date"
              value-format="x"
              placeholder="选择调度时间"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="备注" prop="remark">
            <el-input
              type="textarea"
              v-model="formData.remark"
              :rows="1"
              placeholder="请输入备注"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="单位" prop="deptId">
            <el-tree-select
              v-model="formData.deptId"
              :data="deptIdTreeData"
              :props="defaultProps"
              :render-after-expand="false"
              check-on-click-node
              check-strictly
              style="width: 240px"
              @change=" (value) => {handleDeptChange('to',value)}"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="调出单位" prop="deptId">
            <el-tree-select
              v-model="formData.toDeptId"
              :data="deptIdTreeData"
              :props="defaultProps"
              :render-after-expand="false"
              check-on-click-node
              check-strictly
              style="width: 240px"
              @change=" (value) => {handleDeptChange('from',value)}"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="附件" prop="fileUrl">
            <UploadFile :is-show-tip="false" v-model="formData.fileUrl" :limit="1" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 子表的表单 -->
    <ContentWrap>
      <el-tabs v-model="subTabsName" class="-mt-15px -mb-10px">
        <el-tab-pane label="调度产品清单" name="item">
          <StockMoveItemForm ref="itemFormRef" :items="formData.items" :disabled="disabled" />
        </el-tab-pane>
      </el-tabs>
    </ContentWrap>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading" v-if="!disabled">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { StockMoveApi, StockMoveVO } from '@/api/erp/stock/move'
import StockMoveItemForm from './components/StockMoveItemForm.vue'
import {defaultProps, handleTree} from "@/utils/tree";
import * as DeptApi from "@/api/system/dept";

/** ERP 库存调度单表单 */
defineOptions({ name: 'StockMoveForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const formData = ref({
  id: undefined,
  customerId: undefined,
  moveTime: undefined,
  remark: undefined,
  fileUrl: '',
  items: [],
  deptId: undefined,
  toDeptId: undefined
})
const formRules = reactive({
  moveTime: [{ required: true, message: '调度时间不能为空', trigger: 'blur' }],
  deptId: [{required: true, message: '单位不能为空', trigger: 'blur'}],
  toDeptId: [{required: true, message: '调出单位不能为空', trigger: 'blur'}]
})
const disabled = computed(() => formType.value === 'detail')
const formRef = ref() // 表单 Ref
const deptIdTreeData = ref<any[]>([]) // 部门树形结构
const toDeptIdTreeData = ref<any[]>([]) // 调出部门树形结构

/** 子表的表单 */
const subTabsName = ref('item')
const itemFormRef = ref()

/** 打开弹窗 */
const open = async (row,type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  await getDeptIdTreeData()
  if(row != undefined && row.deptId != undefined){
    if (itemFormRef.value) {
      await itemFormRef.value.resetWarehouseList(false,'from',row.deptId)
      await itemFormRef.value.resetWarehouseList(false,'to',row.toDeptId)
    }
  }
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await StockMoveApi.getStockMove(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 获取有权限的部门 */
const getDeptIdTreeData = async () => {
  deptIdTreeData.value = handleTree(await DeptApi.getSimpleDeptList())
  toDeptIdTreeData.value = handleTree(await DeptApi.getSimpleDeptList())
}

/** 部门更改时 */
const handleDeptChange = (type: string ,newDeptId: number) => {
  if (itemFormRef.value) {
    itemFormRef.value.resetWarehouseList(true,type,newDeptId)
  }
}


/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  await itemFormRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as StockMoveVO
    if (formType.value === 'create') {
      await StockMoveApi.createStockMove(data)
      message.success(t('common.createSuccess'))
    } else {
      await StockMoveApi.updateStockMove(data)
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
    customerId: undefined,
    moveTime: undefined,
    remark: undefined,
    fileUrl: undefined,
    items: [],
    deptId: undefined,
    toDeptId: undefined
  }
  formRef.value?.resetFields()
}
</script>
