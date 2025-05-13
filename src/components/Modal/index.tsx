import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
    openModal: boolean;
    closeModal: () => void;
    children: ReactNode;
};

function Modal({ openModal, closeModal, children }: ModalProps) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (openModal) {
            ref.current?.showModal();
        } else {
            ref.current?.close();
        }
    }, [openModal]);

    return (
        <dialog ref={ref} onCancel={closeModal}>
            {children}
            <button onClick={closeModal}>Close</button>
        </dialog>
    );
}

export default Modal;
