import styles from './spinner.module.css'

const Spinner = ({spinnerColor, labelColor, label}) => {
  return (
    <div className={styles.spinner_container}>
    <div className={ styles.lds_spinner } style={ { color: spinnerColor || 'var(--color-principal-500)' } }><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
    <p className={styles.label} style={{color: labelColor || 'var(--text-color)'}}>{label}</p>
    </div>
  )
}

export default Spinner