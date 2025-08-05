package com.example.elitescorebackend.response;

import jakarta.xml.bind.annotation.XmlRootElement;

/**
 * Generic API response wrapper for returning consistent
 * responses in JSON or XML format.
 *
 * @param <T> the type of the data payload.
 */
@XmlRootElement
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    /**
     * Default constructor for serialization frameworks.
     */
    public ApiResponse() {
    }

    /**
     * Creates a new API response with specified success flag,
     * message, user role, and data payload.
     *
     * @param success indicates if the operation was successful.
     * @param message the message describing the result.
     * @param data    the data payload.
     */
    public ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    /**
     * Indicates whether the operation was successful.
     *
     * @return true if successful; false otherwise.
     */
    public boolean isSuccess() {
        return success;
    }

    /**
     * Sets the success flag for the response.
     *
     * @param success true if the operation was successful.
     */
    public void setSuccess(boolean success) {
        this.success = success;
    }

    /**
     * Gets the message describing the response.
     *
     * @return the response message.
     */
    public String getMessage() {
        return message;
    }

    /**
     * Sets the message describing the response.
     *
     * @param message the response message.
     */
    public void setMessage(String message) {
        this.message = message;
    }

    /**
     * Gets the data payload of the response.
     *
     * @return the data payload.
     */
    public T getData() {
        return data;
    }

    /**
     * Sets the data payload of the response.
     *
     * @param data the data payload.
     */
    public void setData(T data) {
        this.data = data;
    }
}
