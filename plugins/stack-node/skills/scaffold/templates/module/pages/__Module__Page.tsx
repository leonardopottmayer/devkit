import { useTranslation } from 'react-i18next'
import { use__Resources__ } from '../hooks/use__Resources__'

export function __Module__Page() {
  const { t } = useTranslation()
  const { data: __resources__ = [], isLoading } = use__Resources__()

  return (
    <section>
      <h1>{t('__module__.title')}</h1>
      {isLoading ? (
        <p>{t('__module__.loading')}</p>
      ) : (
        <ul>
          {__resources__.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
