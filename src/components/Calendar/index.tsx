/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {useEffect, useRef, useState} from "react";

import type {ScheduleInstance} from "../../models/schedule";
import type {UserInstance} from "../../models/user";

import FullCalendar from "@fullcalendar/react";

import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";

import type {EventInput} from "@fullcalendar/core/index.js";

import "../profileCalendar.scss";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import Modal from "../Modal";
import {updateAssignmentDate} from "../../store/schedule/actions.ts";
import {useDispatch} from "react-redux";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat)

type CalendarContainerProps = {
    schedule: ScheduleInstance;
    auth: UserInstance;
};

const classes = [
    "bg-one",
    "bg-two",
    "bg-three",
    "bg-four",
    "bg-five",
    "bg-six",
    "bg-seven",
    "bg-eight",
    "bg-nine",
    "bg-ten",
    "bg-eleven",
    "bg-twelve",
    "bg-thirteen",
    "bg-fourteen",
    "bg-fifteen",
    "bg-sixteen",
    "bg-seventeen",
    "bg-eighteen",
    "bg-nineteen",
    "bg-twenty",
    "bg-twenty-one",
    "bg-twenty-two",
    "bg-twenty-three",
    "bg-twenty-four",
    "bg-twenty-five",
    "bg-twenty-six",
    "bg-twenty-seven",
    "bg-twenty-eight",
    "bg-twenty-nine",
    "bg-thirty",
    "bg-thirty-one",
    "bg-thirty-two",
    "bg-thirty-three",
    "bg-thirty-four",
    "bg-thirty-five",
    "bg-thirty-six",
    "bg-thirty-seven",
    "bg-thirty-eight",
    "bg-thirty-nine",
    "bg-forty",
];

const CalendarContainer = ({schedule, auth}: CalendarContainerProps) => {
    const dispatch = useDispatch();
    const calendarRef = useRef<FullCalendar>(null);

    const [events, setEvents] = useState<EventInput[]>([]);
    const [highlightedDates, setHighlightedDates] = useState<string[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
    const [initialDate, setInitialDate] = useState<Date>(
        dayjs(schedule?.scheduleStartDate).toDate()
    );
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [event, setEvent] = useState({staff: "", title: "", startDate: "", endDate: ""})
    const [pairedDays, setPairedDays] = useState<string[][]>();
    const getPlugins = () => {
        const plugins = [dayGridPlugin];

        plugins.push(interactionPlugin);
        return plugins;
    };

    const getShiftById = (id: string) => {
        return schedule?.shifts?.find((shift: { id: string }) => id === shift.id);
    };

    const getAssigmentById = (id: string) => {
        return schedule?.assignments?.find((assign) => id === assign.id);
    };

    const getStaffById = (id: string) => {
        return schedule?.staffs?.find((staff) => id === staff.id);
    };

    const validDates = () => {
        const dates = [];
        let currentDate = dayjs(schedule.scheduleStartDate);
        while (
            currentDate.isBefore(schedule.scheduleEndDate) ||
            currentDate.isSame(schedule.scheduleEndDate)
            ) {
            dates.push(currentDate.format("YYYY-MM-DD"));
            currentDate = currentDate.add(1, "day");
        }

        return dates;
    };

    const getDatesBetween = (startDate: string, endDate: string) => {
        const dates = [];
        const start = dayjs(startDate, "DD.MM.YYYY").toDate();
        const end = dayjs(endDate, "DD.MM.YYYY").toDate();
        const current = new Date(start);

        while (current <= end) {
            dates.push(dayjs(current).format("DD-MM-YYYY"));
            current.setDate(current.getDate() + 1);
        }

        return dates;
    };

    const generateStaffBasedCalendar = () => {
        const works: EventInput[] = [];

        for (let i = 0; i < schedule?.assignments?.length; i++) {
            const className = schedule?.shifts?.findIndex(
                (shift) => shift.id === schedule?.assignments?.[i]?.shiftId
            );

            const assignmentDate = dayjs
                .utc(schedule?.assignments?.[i]?.shiftStart)
                .format("YYYY-MM-DD");
            const isValidDate = validDates().includes(assignmentDate);

            const work = {
                id: schedule?.assignments?.[i]?.id,
                title: getShiftById(schedule?.assignments?.[i]?.shiftId)?.name,
                duration: "01:00",
                date: assignmentDate,
                staffId: schedule?.assignments?.[i]?.staffId,
                shiftId: schedule?.assignments?.[i]?.shiftId,
                className: `event ${classes[className]} ${
                    getAssigmentById(schedule?.assignments?.[i]?.id)?.isUpdated
                        ? "highlight"
                        : ""
                } ${!isValidDate ? "invalid-date" : ""}`,
            };
            works.push(work);
        }

        const offDays = schedule?.staffs?.find(
            (staff) => staff.id === selectedStaffId
        )?.offDays;

        const pairedDays = schedule?.staffs?.find(
            (staff) => staff.id === selectedStaffId
        )?.pairList;


        const dates = getDatesBetween(
            dayjs(schedule.scheduleStartDate).format("DD.MM.YYYY"),
            dayjs(schedule.scheduleEndDate).format("DD.MM.YYYY")
        );

        const allPairedDays = pairedDays?.map((p) =>
            getDatesBetween(dayjs(p.startDate, "DD.MM.YYYY").format("DD.MM.YYYY"),
            dayjs(p.endDate, "DD.MM.YYYY").format("DD.MM.YYYY")))


        let highlightedDates: string[] = [];

        dates.forEach((date) => {
            const transformedDate = dayjs(date, "DD-MM-YYYY").format("DD.MM.YYYY");
            if (offDays?.includes(transformedDate)) highlightedDates.push(date);
        });

        const filteredWorks = works.filter((s) => s.staffId === selectedStaffId)
        setHighlightedDates(highlightedDates);
        setPairedDays(allPairedDays)
        setEvents(filteredWorks);
    };

    useEffect(() => {
        setSelectedStaffId(schedule?.staffs?.[0]?.id);
        generateStaffBasedCalendar();
    }, [schedule]);

    useEffect(() => {
        generateStaffBasedCalendar();
    }, [selectedStaffId]);

    const RenderEventContent = ({eventInfo}: any) => {
        return (
            <div className="event-content" onClick={() => {
                setIsDialogOpen(true)
                setEvent({
                    staff: getStaffById(eventInfo.event._def.extendedProps.staffId)?.name ?? "",
                    title: eventInfo.event.title,
                    startDate: eventInfo.event._instance.range.start.toLocaleString(),
                    endDate: eventInfo.event._instance.range.end.toLocaleString(),
                })
            }}>
                <p>{eventInfo.event.title}</p>

            </div>
        );
    };

    const EventModal = () => {
        return (
            <Modal
                openModal={isDialogOpen}
                closeModal={() => setIsDialogOpen(false)}
            >
                <p>Name: {event.staff}</p>
                <p>Title: {event.title}</p>
                <p>Start Date: {event.startDate}</p>
                <p>End Date: {event.endDate}</p>
            </Modal>
        )
    }

    return (
        <div className="calendar-section">
            <EventModal></EventModal>
            <div className="calendar-wrapper">
                <div className="staff-list">
                    {schedule?.staffs?.map((staff: any) => (
                        <div
                            key={staff.id}
                            onClick={() => setSelectedStaffId(staff.id)}
                            className={`staff ${
                                staff.id === selectedStaffId ? "active" : ""
                            }`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20px"
                                viewBox="0 -960 960 960"
                                width="20px"
                            >
                                <path
                                    d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17-62.5t47-43.5q60-30 124.5-46T480-440q67 0 131.5 16T736-378q30 15 47 43.5t17 62.5v112H160Zm320-400q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm160 228v92h80v-32q0-11-5-20t-15-14q-14-8-29.5-14.5T640-332Zm-240-21v53h160v-53q-20-4-40-5.5t-40-1.5q-20 0-40 1.5t-40 5.5ZM240-240h80v-92q-15 5-30.5 11.5T260-306q-10 5-15 14t-5 20v32Zm400 0H320h320ZM480-640Z"/>
                            </svg>
                            <span>{staff.name}</span>
                        </div>
                    ))}
                </div>
                <FullCalendar
                    ref={calendarRef}
                    locale={auth.language}
                    plugins={getPlugins()}
                    contentHeight={400}
                    handleWindowResize={true}
                    selectable={true}
                    editable={true}
                    eventOverlap={true}
                    eventDurationEditable={false}
                    initialView="dayGridMonth"
                    initialDate={initialDate}
                    events={events}
                    firstDay={1}
                    dayMaxEventRows={4}
                    fixedWeekCount={true}
                    showNonCurrentDates={true}
                    eventDrop={(e) => {
                        const event = e.event
                        dispatch(updateAssignmentDate({
                            id: event.id,
                            shiftStart: dayjs(event.start).format("YYYY-MM-DDTHH:mm:ss"),
                            shiftEnd: dayjs(event.end ?? event.start).format("YYYY-MM-DDTHH:mm:ss"),
                        }) as any);
                    }}
                    eventContent={(eventInfo: any) => (
                        <RenderEventContent eventInfo={eventInfo}/>
                    )}
                    datesSet={(info: any) => {
                        const prevButton = document.querySelector(
                            ".fc-prev-button"
                        ) as HTMLButtonElement;
                        const nextButton = document.querySelector(
                            ".fc-next-button"
                        ) as HTMLButtonElement;

                        if (
                            calendarRef?.current?.getApi().getDate() &&
                            !dayjs(schedule?.scheduleStartDate).isSame(
                                calendarRef?.current?.getApi().getDate()
                            )
                        )
                            setInitialDate(calendarRef?.current?.getApi().getDate());

                        const startDiff = dayjs(info.start)
                            .utc()
                            .diff(
                                dayjs(schedule.scheduleStartDate).subtract(1, "day").utc(),
                                "days"
                            );
                        const endDiff = dayjs(dayjs(schedule.scheduleEndDate)).diff(
                            info.end,
                            "days"
                        );
                        if (startDiff < 0 && startDiff > -35) prevButton.disabled = true;
                        else prevButton.disabled = false;

                        if (endDiff < 0 && endDiff > -32) nextButton.disabled = true;
                        else nextButton.disabled = false;
                    }}
                    dayCellContent={({date}) => {
                        const found = validDates().includes(
                            dayjs(date).format("YYYY-MM-DD")
                        );
                        const isHighlighted = highlightedDates.includes(
                            dayjs(date).format("DD-MM-YYYY")
                        );

                        const highlightedStyle = pairedDays?.map((p,index) => {
                            if(p.includes( dayjs(date).format("DD-MM-YYYY"))) {
                                return index
                            }

                        }).filter(item => item !== undefined)


                        return (
                            <div
                                className={`${found ? "" : "date-range-disabled"} ${
                                    isHighlighted ? "highlighted-date-orange" : ""
                                } ${highlightedStyle &&  `highlightedPair${highlightedStyle[0]}`}   `}
                            >
                                {dayjs(date).date()}
                            </div>
                        );
                    }}
                />
            </div>
        </div>
    );
};

export default CalendarContainer;
