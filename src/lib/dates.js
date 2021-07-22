import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
// import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);

export default dayjs;
