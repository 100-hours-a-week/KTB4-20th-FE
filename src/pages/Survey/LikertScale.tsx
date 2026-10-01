import styles from './LikertScale.module.css';

const SCALE_VALUES = [1, 2, 3, 4, 5] as const;

/**
 * "~하는 것을 좋아한다"처럼 끝맺는 말이 있으면 문항을 앞부분과 끝맺는 말로 나눈다.
 * 두 줄로 넘어갈 때 끝맺는 말이 통째로 다음 줄로 가서 "…체험형 시설을 / 방문하는 것을 좋아한다"처럼
 * 뜻 단위로 끊긴다. '것을'이 없는 문항은 나누지 않고 두 줄 길이를 고르게만 맞춘다.
 */
function splitQuestion(text: string): [string, string] {
  const words = text.trim().split(/\s+/);
  const objectIndex = words.lastIndexOf('것을');
  if (objectIndex < 2) return [text, ''];
  return [words.slice(0, objectIndex - 1).join(' '), words.slice(objectIndex - 1).join(' ')];
}

interface LikertScaleProps {
  questionText: string;
  value: number;
  onChange: (value: number) => void;
}

export default function LikertScale({ questionText, value, onChange }: LikertScaleProps) {
  return (
    <fieldset className={styles.field}>
      <legend className={styles.question}>
        {(() => {
          const [head, tail] = splitQuestion(questionText);
          return tail ? (
            <>
              <span className={styles.questionHead}>{head}</span>{' '}
              <span className={styles.questionTail}>{tail}</span>
            </>
          ) : (
            questionText
          );
        })()}
      </legend>
      <div className={styles.scaleRow} role="radiogroup" aria-label={questionText}>
        {SCALE_VALUES.map((scaleValue) => (
          <button
            key={scaleValue}
            type="button"
            role="radio"
            aria-checked={value === scaleValue}
            aria-label={`${scaleValue}점`}
            className={value === scaleValue ? `${styles.dot} ${styles.dotSelected}` : styles.dot}
            onClick={() => onChange(scaleValue)}
          />
        ))}
      </div>
      <div className={styles.scaleLabels}>
        <span>전혀 아니다</span>
        <span>매우 그렇다</span>
      </div>
    </fieldset>
  );
}
