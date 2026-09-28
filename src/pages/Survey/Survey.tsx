import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorCode } from '../../api/chat';
import {
  fetchMySurvey,
  fetchSurveyCatalog,
  saveMySurvey,
  type PreferenceQuestion,
  type SurveyExclusionCategory,
} from '../../api/survey';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SURVEY_CATEGORY_LABELS } from '../../constants/surveyCategories';
import LikertScale from './LikertScale';
import styles from './Survey.module.css';

const CATEGORY_LABELS = SURVEY_CATEGORY_LABELS;

const DEFAULT_SCORE = 3;

const SUBMIT_ERROR_MESSAGES: Record<string, string> = {
  SURVEY_SUBMISSION_CLOSED: '설문 제출 기간이 종료됐어요.',
  SURVEY_RESUBMISSION_CLOSED: '설문 수정 기간이 종료됐어요.',
  TRIP_MEMBER_REQUIRED: '여행방 멤버만 설문에 참여할 수 있어요.',
  TRIP_NOT_FOUND: '여행방을 찾을 수 없어요.',
};
const DEFAULT_SUBMIT_ERROR_MESSAGE = '설문을 제출하지 못했어요. 잠시 후 다시 시도해 주세요.';

interface CategoryGroup {
  code: string;
  label: string;
  questions: PreferenceQuestion[];
}

function groupByCategory(questions: PreferenceQuestion[]): CategoryGroup[] {
  const groups: CategoryGroup[] = [];
  const indexByCode = new Map<string, number>();

  for (const question of questions) {
    let index = indexByCode.get(question.categoryCode);
    if (index === undefined) {
      index = groups.length;
      indexByCode.set(question.categoryCode, index);
      groups.push({
        code: question.categoryCode,
        label: CATEGORY_LABELS[question.categoryCode] ?? question.categoryCode,
        questions: [],
      });
    }
    groups[index].questions.push(question);
  }

  return groups;
}

export default function Survey() {
  const { tripId = '' } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [exclusionCategories, setExclusionCategories] = useState<SurveyExclusionCategory[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState('loading');
      try {
        const [catalog, survey] = await Promise.all([
          fetchSurveyCatalog(),
          fetchMySurvey(tripId),
        ]);
        if (cancelled) return;

        setCategories(groupByCategory(catalog.questions));
        setExclusionCategories(catalog.exclusionCategories);

        const initialScores: Record<string, number> = {};
        for (const question of catalog.questions) {
          initialScores[question.questionId] = DEFAULT_SCORE;
        }
        for (const answer of survey.answers) {
          initialScores[answer.questionId] = answer.score;
        }
        setScores(initialScores);
        setExcluded(new Set(survey.excludedCategoryIds));
        setLoadState('ready');
      } catch (error) {
        if (cancelled) return;
        const code = getApiErrorCode(error);
        setLoadErrorMessage(
          code === 'TRIP_MEMBER_REQUIRED'
            ? '여행방 멤버만 설문에 참여할 수 있어요.'
            : code === 'TRIP_NOT_FOUND'
              ? '여행방을 찾을 수 없어요.'
              : null,
        );
        setLoadState('error');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const totalSteps = categories.length + 1;
  const isDealbreakerStep = stepIndex === categories.length;
  const currentCategory = categories[stepIndex] as CategoryGroup | undefined;

  function goToPreviousStep() {
    if (stepIndex === 0) {
      navigate(-1);
      return;
    }
    setStepIndex((index) => index - 1);
  }

  function goToNextStep() {
    setStepIndex((index) => Math.min(index + 1, totalSteps - 1));
  }

  function toggleExclusion(categoryId: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const answers = Object.entries(scores).map(([questionId, score]) => ({
        questionId,
        score,
      }));
      await saveMySurvey(tripId, {
        answers,
        excludedCategoryIds: Array.from(excluded),
      });
      setSubmitted(true);
    } catch (error) {
      const code = getApiErrorCode(error);
      toast.error((code && SUBMIT_ERROR_MESSAGES[code]) ?? DEFAULT_SUBMIT_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadState === 'loading') {
    return (
      <div className={styles.centerStatus}>
        <p>설문을 불러오는 중이에요.</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className={styles.centerStatus}>
        <p>{loadErrorMessage ?? '설문을 불러오지 못했어요.'}</p>
        <Button onClick={() => navigate(-1)}>돌아가기</Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.centerStatus}>
        <div className={styles.doneIcon}>
          <Check className="size-7" />
        </div>
        <h1 className={styles.doneTitle}>제출 완료!</h1>
        <p className={styles.doneSubtitle}>
          다른 멤버들의 제출을 기다리고 있어요
          <br />
          모두 제출하면 동선이 만들어져요
        </p>
        <Button
          className="mt-2 w-full max-w-xs"
          onClick={() => navigate(`/trips/${encodeURIComponent(tripId)}`, { replace: true })}
        >
          방으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={goToPreviousStep}
          aria-label="이전 화면"
        >
          <ArrowLeft className="size-5" />
        </Button>

        {!isDealbreakerStep && (
          <div className={styles.progressBar} aria-hidden="true">
            {categories.map((category, index) => (
              <span
                key={category.code}
                className={styles.progressSegment}
                data-state={
                  index < stepIndex ? 'done' : index === stepIndex ? 'current' : 'upcoming'
                }
              />
            ))}
          </div>
        )}
      </header>

      <div className={styles.content}>
        {!isDealbreakerStep && currentCategory && (
          <>
            <Badge variant="outline" className={styles.categoryBadge}>
              {currentCategory.label}
            </Badge>
            <h1 className={styles.title}>이번 여행에서 어떤 걸 하고 싶으세요?</h1>

            <div className={styles.questionList}>
              {currentCategory.questions.map((question) => (
                <LikertScale
                  key={question.questionId}
                  questionText={question.questionText}
                  value={scores[question.questionId] ?? DEFAULT_SCORE}
                  onChange={(value) =>
                    setScores((prev) => ({ ...prev, [question.questionId]: value }))
                  }
                />
              ))}
            </div>
          </>
        )}

        {isDealbreakerStep && (
          <div className={styles.dealbreakerSection}>
            <div className={styles.dealbreakerIcon}>
              <Ban className="size-6" />
            </div>
            <h1 className={styles.title}>절대 하고 싶지 않은 게 있나요?</h1>
            <p className={styles.subtitle}>고른 항목은 이번 동선에서 완전히 제외돼요</p>

            <div className={styles.chipGrid}>
              {exclusionCategories.map((category) => {
                const isSelected = excluded.has(category.categoryId);
                return (
                  <button
                    key={category.categoryId}
                    type="button"
                    aria-pressed={isSelected}
                    className={
                      isSelected ? `${styles.chip} ${styles.chipSelected}` : styles.chip
                    }
                    onClick={() => toggleExclusion(category.categoryId)}
                  >
                    {category.name.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        {stepIndex > 0 && (
          <Button type="button" variant="secondary" className="flex-1" onClick={goToPreviousStep}>
            이전
          </Button>
        )}
        {isDealbreakerStep ? (
          <Button type="button" className="flex-1" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '제출하는 중...' : '제출하기'}
          </Button>
        ) : (
          <Button type="button" className="flex-1" onClick={goToNextStep}>
            다음
          </Button>
        )}
      </footer>
    </div>
  );
}
