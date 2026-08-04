import { LoadingOutlined } from '@ant-design/icons';

interface SpinnerProps {
  className?: string;
}

const Spinner = ({ className = 'text-base' }: SpinnerProps) => (
  <LoadingOutlined spin className={className} aria-hidden="true" />
);

export default Spinner;
