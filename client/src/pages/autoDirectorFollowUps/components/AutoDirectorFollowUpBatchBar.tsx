import type { AutoDirectorFollowUpItem, AutoDirectorMutationActionCode } from "@ai-novel/shared/types/autoDirectorFollowUp";
import type { AutoDirectorFollowUpSection } from "@ai-novel/shared/types/autoDirectorValidation";
import { Button } from "@/components/ui/button";
import { TaskQueueActionRow } from "@/components/taskQueue";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";

interface AutoDirectorFollowUpBatchBarProps {
  selectedItems: AutoDirectorFollowUpItem[];
  batchActionCode: AutoDirectorMutationActionCode | null;
  loading: boolean;
  onClear: () => void;
  onExecute: (actionCode?: AutoDirectorMutationActionCode) => void | Promise<void>;
}

function formatBatchActionLabel(actionCode: AutoDirectorMutationActionCode | null): string {
  if (actionCode === "continue_auto_execution") {
    return "批量低风险继续";
  }
  if (actionCode === "retry_with_task_model") {
    return "批量重试异常任务";
  }
  if (actionCode === "dismiss_follow_up") {
    return "批量清理跟进卡片";
  }
  return "当前所选项没有共同批量动作";
}

function getSelectedSection(items: AutoDirectorFollowUpItem[]): AutoDirectorFollowUpSection | null {
  const sections = Array.from(new Set(items.map((item) => item.section)));
  return sections.length === 1 ? sections[0] : null;
}

export function AutoDirectorFollowUpBatchBar({
  selectedItems,
  batchActionCode,
  loading,
  onClear,
  onExecute,
}: AutoDirectorFollowUpBatchBarProps) {
  if (selectedItems.length === 0) {
    return null;
  }
  const selectedSection = getSelectedSection(selectedItems);
  const consequence = batchActionCode === "continue_auto_execution"
    ? "只向所选导演任务分别提交继续命令，不会跨任务合并状态。"
    : batchActionCode === "retry_with_task_model"
      ? "每个任务都会使用各自保存的模型重试，并保持对应的导演任务身份。"
      : "支持对选中的任务批量执行重试或彻底清理移出跟进中心。";

  return (
    <div className={AUTO_DIRECTOR_MOBILE_CLASSES.followUpBatchBar}>
      <TaskQueueActionRow
        title={`已选择 ${selectedItems.length} 项 · ${selectedSection === "pending" || selectedSection === "exception" ? formatBatchActionLabel(batchActionCode) : "提供批量动作"}`}
        consequence={consequence}
        tone={selectedSection === "exception" ? "danger" : "info"}
        action={(
          <div className="grid grid-cols-2 gap-2 md:flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full md:w-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            disabled={loading}
          >
            取消选择
          </Button>
          {selectedSection === "exception" || selectedSection === "needs_validation" ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="w-full md:w-auto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void onExecute("dismiss_follow_up");
              }}
              disabled={loading}
            >
              批量清理跟进
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="w-full md:w-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void onExecute();
            }}
            disabled={!batchActionCode || loading}
          >
            执行批量重试
          </Button>
          </div>
        )}
      />
    </div>
  );
}
