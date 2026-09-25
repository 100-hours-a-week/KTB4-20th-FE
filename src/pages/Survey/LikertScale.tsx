import styles from './LikertScale.module.css';

const SCALE_VALUES = [1, 2, 3, 4, 5] as const;

interface LikertScaleProps {
  questionText: string;
  value: number;
  onChange: (value: number) => void;
}

export default function LikertScale({ questionText, value, onChange }: LikertScaleProps) {
  return (
    <fieldset className={styles.field}>
      <legend className={styles.question}>{questionText}</legend>
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
