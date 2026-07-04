import * as React from 'react';

import { Field, makeStyles, Option, tokens } from '@fluentui/react-components';
import { AppDropdown } from '../Dropdown/AppDropdown';

import { ILookupItem } from '../../models/IAssetApp';

import { IDashboardFilters } from '../../utils/dashboardAnalytics';



const useStyles = makeStyles({

  root: {

    display: 'flex',

    flexWrap: 'wrap',

    gap: tokens.spacingHorizontalM,

    alignItems: 'flex-end'

  },

  field: {

    minWidth: '200px',

    flex: '1 1 200px',

    '@media (max-width: 640px)': {

      minWidth: '100%',

      flex: '1 1 100%'

    }

  }

});



export interface IDashboardFiltersProps {

  filters: IDashboardFilters;

  businesses: ILookupItem[];

  projectOptions: ILookupItem[];

  onChange: (filters: IDashboardFilters) => void;

}



export const DashboardFilters: React.FC<IDashboardFiltersProps> = ({

  filters,

  businesses,

  projectOptions,

  onChange

}) => {

  const styles = useStyles();

  const businessLabel =

    filters.businessId === 'all'

      ? 'All businesses'

      : businesses.find((item) => String(item.Id) === filters.businessId)?.Title || 'All businesses';

  const projectLabel =

    filters.projectId === 'all'

      ? 'All projects'

      : projectOptions.find((item) => String(item.Id) === filters.projectId)?.Title || 'All projects';



  return (

    <div className={styles.root}>

      <Field label="Business" className={styles.field}>

        <AppDropdown

          value={businessLabel}

          selectedOptions={[filters.businessId]}

          onOptionSelect={(_, data) =>

            onChange({ businessId: data.optionValue || 'all', projectId: 'all' })

          }

        >

          <Option value="all">All businesses</Option>

          {businesses.map((business) => (

            <Option key={business.Id} value={String(business.Id)}>

              {business.Title}

            </Option>

          ))}

        </AppDropdown>

      </Field>

      <Field label="Project" className={styles.field}>

        <AppDropdown

          value={projectLabel}

          selectedOptions={[filters.projectId]}

          onOptionSelect={(_, data) =>

            onChange({ ...filters, projectId: data.optionValue || 'all' })

          }

        >

          <Option value="all">All projects</Option>

          {projectOptions.map((project) => (

            <Option key={project.Id} value={String(project.Id)}>

              {project.Title}

            </Option>

          ))}

        </AppDropdown>

      </Field>

    </div>

  );

};

